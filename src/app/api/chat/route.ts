import { GoogleGenAI } from '@google/genai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractAndSaveMemories, retrieveRelevantMemories } from '@/lib/memory';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const BASE_SYSTEM_INSTRUCTION = `you are Loom, a quiet, thoughtful advisor for a college student. you speak in lowercase, warmly and briefly. you help with academics, career, and personal life. you remember things about the person from past conversations and weave them in naturally when relevant. don't list what you remember back at them, just let it inform how you reply.`;

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages, conversationId: incomingId } = (await req.json()) as {
        messages: { role: 'user' | 'assistant'; content: string }[];
        conversationId?: string | null;
    };
    let conversationId: string;
    if (incomingId) {
        conversationId = incomingId;
    } else {
        const { data: conv, error } = await supabase
            .from('conversations')
            .insert({ user_id: user.id })
            .select('id')
            .single();
        if (error || !conv) {
            return new Response('Failed to create conversation', { status: 500 });
        }
        conversationId = conv.id;
    }


    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: lastMessage.content,
        });
    }

    // Retrieve relevant memories and inject into system instruction
    let systemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (lastMessage?.role === 'user') {
        const memories = await retrieveRelevantMemories(
            supabase,
            lastMessage.content,
            8
        );
        if (memories.length > 0) {
            const memoryLines = memories.map((m) => `- ${m.content}`).join('\n');
            systemInstruction += `\n\nthings you remember about this person (don't list these back, just let them shape your reply):\n${memoryLines}`;
            console.log(`[memory] injected ${memories.length} memories into context`);
        }
    }

    const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const result = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction },
    });

    const encoder = new TextEncoder();
    let accumulated = '';

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of result) {
                    const text = chunk.text;
                    if (text) {
                        accumulated += text;
                        controller.enqueue(encoder.encode(text));
                    }
                }
                if (accumulated) {
                    await supabase.from('messages').insert({
                        conversation_id: conversationId,
                        role: 'assistant',
                        content: accumulated,
                    });
                    await supabase
                        .from('conversations')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', conversationId);
                }
                controller.close();
            } catch (err) {
                controller.error(err);
                return;
            }

            if (accumulated && lastMessage?.role === 'user') {
                await extractAndSaveMemories(
                    supabase,
                    user.id,
                    conversationId,
                    lastMessage.content,
                    accumulated
                );
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            'X-Conversation-Id': conversationId,
        },
    });
}