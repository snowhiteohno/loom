'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-grow the textarea with its content.
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [input]);

    function newConversation() {
        if (isStreaming) return;
        setMessages([]);
        setConversationId(null);
        setInput('');
        textareaRef.current?.focus();
    }

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
        <div className="flex flex-col h-screen">
            <header className="px-8 py-5 md:px-12 md:py-6 flex items-center justify-between border-b border-border/40 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="font-display italic text-2xl text-foreground/90">loom</span>
                    <span className="text-primary/50 text-xs">✦</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={newConversation}
                        disabled={isStreaming || messages.length === 0}
                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/55 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        new
                    </button>
                    <Link
                        href="/profile"
                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/55 hover:text-primary transition-colors"
                    >
                        what i remember →
                    </Link>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 md:px-12">
                <div className="max-w-2xl mx-auto py-10 space-y-8">
                    {messages.length === 0 && (
                        <div className="pt-24 animate-fade-up">
                            <p className="font-display italic text-3xl text-foreground/70 mb-3 leading-tight">
                                tell me about your day.
                            </p>
                            <p className="text-sm text-foreground/40">
                                or anything else. i&apos;m listening.
                            </p>
                        </div>
                    )}

                    {messages.map((m, i) => {
                        const isUser = m.role === 'user';
                        const isStreamingThis =
                            isStreaming && i === messages.length - 1 && m.role === 'assistant';

                        if (isUser) {
                            return (
                                <div key={i} className="flex justify-end animate-fade-up">
                                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/10 border border-primary/15 px-4 py-3 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                        {m.content}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={i} className="space-y-2 animate-fade-up">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary/60">
                                    <span>loom</span>
                                    <span className="rule-fade flex-1" />
                                </div>
                                <div className="text-[15px] text-foreground/90 prose-loom">
                                    {m.content ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    ) : isStreamingThis ? (
                                        <span className="loom-dots inline-flex items-center" aria-label="thinking">
                                            <span /><span /><span />
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </main>

            <footer className="px-6 md:px-12 pb-6 pt-2">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-end gap-3 rounded-2xl border border-border bg-background/70 backdrop-blur-sm px-4 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="write here…"
                            rows={1}
                            className="flex-1 resize-none bg-transparent border-none outline-none text-[15px] placeholder:text-foreground/30 py-1.5 leading-relaxed disabled:opacity-60"
                            disabled={isStreaming}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isStreaming}
                            aria-label="send"
                            className="shrink-0 mb-0.5 grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
                        >
                            <span className="text-lg leading-none -mt-0.5">↑</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-foreground/30 mt-3 tracking-wide">
                        loom remembers what matters. press enter to send · shift+enter for a new line
                    </p>
                </div>
            </footer>
        </div>
    );
}
