'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
    initialConversationId: string | null;
    initialMessages: Message[];
};

export default function Chat({ initialConversationId, initialMessages }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [conversationId, setConversationId] = useState<string | null>(
        initialConversationId
    );
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || isStreaming) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages([...newMessages, { role: 'assistant', content: '' }]);
        setInput('');
        setIsStreaming(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, conversationId }),
            });

            if (!res.ok || !res.body) throw new Error('Request failed');

            const returnedId = res.headers.get('X-Conversation-Id');
            if (returnedId && returnedId !== conversationId) {
                setConversationId(returnedId);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: 'assistant', content: accumulated };
                    return copy;
                });
            }
        } catch {
            setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                    role: 'assistant',
                    content: 'something went sideways. try again?',
                };
                return copy;
            });
        } finally {
            setIsStreaming(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="px-8 py-6 md:px-12 md:py-8 flex items-center justify-between">
                <span className="font-display italic text-2xl text-foreground/90">loom</span>
                <Link
                    href="/profile"
                    className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground transition-colors"
                >
                    what i remember →
                </Link>
            </header>

            <main className="flex-1 overflow-y-auto px-8 md:px-12">
                <div className="max-w-2xl mx-auto py-8 space-y-10">
                    {messages.length === 0 && (
                        <div className="pt-24">
                            <p className="font-display italic text-2xl text-foreground/60 mb-3">
                                tell me about your day.
                            </p>
                            <p className="text-sm text-foreground/40">
                                or anything else. i&apos;m listening.
                            </p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className="space-y-2">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                                {m.role === 'user' ? 'you' : 'loom'}
                            </div>
                            <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                {m.content ||
                                    (i === messages.length - 1 && isStreaming ? '…' : '')}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </main>

            <footer className="px-8 md:px-12 py-6 border-t border-foreground/10">
                <div className="max-w-2xl mx-auto flex items-end gap-4">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="write here…"
                        rows={1}
                        className="flex-1 resize-none bg-transparent border-none outline-none text-base placeholder:text-foreground/30 py-2 max-h-32"
                        disabled={isStreaming}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isStreaming}
                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed pb-2"
                    >
                        {isStreaming ? 'thinking…' : 'send'}
                    </button>
                </div>
            </footer>
        </div>
    );
}