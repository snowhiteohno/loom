import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Chat from './chat';

type Message = { role: 'user' | 'assistant'; content: string };
export type ConversationSummary = {
    id: string;
    title: string;
    updatedAt: string;
};

export default async function ChatPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // All conversations for the sidebar (most recent first).
    const { data: convRows } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

    const conversations: ConversationSummary[] = [];
    if (convRows && convRows.length > 0) {
        // Derive a readable title from each conversation's first user message.
        const ids = convRows.map((c) => c.id);
        const { data: firstMsgs } = await supabase
            .from('messages')
            .select('conversation_id, content, role, created_at')
            .in('conversation_id', ids)
            .eq('role', 'user')
            .order('created_at', { ascending: true });

        const titleByConv = new Map<string, string>();
        for (const m of firstMsgs ?? []) {
            if (!titleByConv.has(m.conversation_id)) {
                const snippet = (m.content as string).trim().replace(/\s+/g, ' ');
                titleByConv.set(
                    m.conversation_id,
                    snippet.length > 40 ? snippet.slice(0, 40) + '…' : snippet
                );
            }
        }

        for (const c of convRows) {
            conversations.push({
                id: c.id,
                title: titleByConv.get(c.id) || 'new thread',
                updatedAt: c.updated_at,
            });
        }
    }

    // Load messages for the most recent conversation.
    const activeId = conversations[0]?.id ?? null;
    let initialMessages: Message[] = [];
    if (activeId) {
        const { data: rows } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', activeId)
            .order('created_at', { ascending: true });
        if (rows) {
            initialMessages = rows.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }));
        }
    }

    return (
        <Chat
            initialConversationId={activeId}
            initialMessages={initialMessages}
            initialConversations={conversations}
        />
    );
}
