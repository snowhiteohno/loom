import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ALLOWED_CATEGORIES = ['academic', 'career', 'personal', 'profile_base'] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

const DEDUP_THRESHOLD = 0.8;

const EXTRACTION_INSTRUCTION = `you analyze a short exchange between a user and their advisor "Loom".

your job: extract durable facts about the user that would help Loom remember them across future conversations.

categories (you MUST use one of exactly these four):
- "profile_base": biographical basics (location, age, year in college, major)
- "academic": courses, deadlines, projects, school details
- "career": career interests, fields they want to explore, role aspirations
- "personal": relationships, hobbies, preferences, daily life, routines, food, communication style

DO NOT extract:
- transient feelings ("stressed today")
- conversational moves ("asked about X")
- generic statements ("learning is hard")

return ONLY a JSON array, no prose. each item: { "content": string, "category": "profile_base" | "academic" | "career" | "personal" }.

if nothing durable, return [].`;

type ExtractedMemory = {
    content: string;
    category: string;
};

export type RetrievedMemory = {
    id: string;
    content: string;
    category: string;
    similarity: number;
};

export async function retrieveRelevantMemories(
    supabase: SupabaseClient,
    query: string,
    limit: number = 5
): Promise<RetrievedMemory[]> {
    try {
        const embedResult = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: [query],
            config: { outputDimensionality: 768 },
        });

        const queryEmbedding = embedResult.embeddings?.[0]?.values;
        if (!queryEmbedding) {
            console.error('[memory] failed to embed query');
            return [];
        }

        const { data, error } = await supabase.rpc('match_memories', {
            query_embedding: queryEmbedding,
            match_count: limit,
        });

        if (error) {
            console.error('[memory] retrieval failed:', error);
            return [];
        }

        return (data ?? []) as RetrievedMemory[];
    } catch (err) {
        console.error('[memory] retrieval error:', err);
        return [];
    }
}

export async function extractAndSaveMemories(
    supabase: SupabaseClient,
    userId: string,
    _conversationId: string,
    userMessage: string,
    assistantMessage: string
) {
    try {
        const transcript = `[user]: ${userMessage}\n[loom]: ${assistantMessage}`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: transcript }] }],
            config: {
                systemInstruction: EXTRACTION_INSTRUCTION,
                responseMimeType: 'application/json',
            },
        });

        const responseText = result.text;
        if (!responseText) return;

        let memories: ExtractedMemory[];
        try {
            memories = JSON.parse(responseText);
        } catch {
            console.error('[memory] non-JSON extraction:', responseText);
            return;
        }

        if (!Array.isArray(memories) || memories.length === 0) {
            console.log('[memory] no durable facts in this exchange');
            return;
        }

        const normalized = memories.map((m) => ({
            content: m.content,
            category: (ALLOWED_CATEGORIES as readonly string[]).includes(m.category)
                ? (m.category as Category)
                : ('personal' as Category),
        }));

        let embeddings: (number[] | null)[] = normalized.map(() => null);
        try {
            const embedResult = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: normalized.map((m) => m.content),
                config: { outputDimensionality: 768 },
            });
            embeddings = (embedResult.embeddings ?? []).map(
                (e) => e.values ?? null
            );
        } catch (err) {
            console.error('[memory] embedding failed, saving without:', err);
        }

        const rowsToInsert: {
            user_id: string;
            content: string;
            category: Category;
            embedding: number[] | null;
        }[] = [];

        for (let i = 0; i < normalized.length; i++) {
            const candidate = normalized[i];
            const candidateEmbedding = embeddings[i];

            if (candidateEmbedding) {
                const { data: similar } = await supabase.rpc('match_memories', {
                    query_embedding: candidateEmbedding,
                    match_count: 1,
                });

                if (
                    similar &&
                    similar.length > 0 &&
                    similar[0].similarity > DEDUP_THRESHOLD
                ) {
                    console.log(
                        `[memory] skipped duplicate (sim ${similar[0].similarity.toFixed(2)}): "${candidate.content}" ~ "${similar[0].content}"`
                    );
                    continue;
                }
            }

            rowsToInsert.push({
                user_id: userId,
                content: candidate.content,
                category: candidate.category,
                embedding: candidateEmbedding ?? null,
            });
        }

        if (rowsToInsert.length === 0) {
            console.log('[memory] all candidates were duplicates, nothing new to save');
            return;
        }

        const { error } = await supabase.from('memories').insert(rowsToInsert);
        if (error) {
            console.error('[memory] insert failed:', error);
        } else {
            const skipped = normalized.length - rowsToInsert.length;
            console.log(
                `[memory] saved ${rowsToInsert.length} new memories, skipped ${skipped} duplicates`
            );
        }
    } catch (err) {
        console.error('[memory] extraction error:', err);
    }
}