import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Chat from './chat';

type Message = { role: 'user' | 'assistant'; content: string };

export default async function ChatPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Find the most recent conversation for this user
    const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Load its messages if it exists
    let initialMessages: Message[] = [];
    if (conversation) {
        const { data: rows } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversation.id)
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
            initialConversationId={conversation?.id ?? null}
            initialMessages={initialMessages}
        />
    );
}