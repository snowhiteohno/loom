'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import ThreadsBackground from '@/components/ThreadsBackground';
import ThemeToggle from '@/components/ThemeToggle';
import type { ConversationSummary } from './page';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    memories?: number;
};

type Props = {
    initialConversationId: string | null;
    initialMessages: Message[];
    initialConversations: ConversationSummary[];
};

export default function Chat({
    initialConversationId,
    initialMessages,
    initialConversations,
}: Props) {
    const [conversations, setConversations] =
        useState<ConversationSummary[]>(initialConversations);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [conversationId, setConversationId] = useState<string | null>(
        initialConversationId
    );
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingConv, setLoadingConv] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        setSidebarOpen(false);
        textareaRef.current?.focus();
    }

    async function openConversation(id: string) {
        if (isStreaming || id === conversationId) {
            setSidebarOpen(false);
            return;
        }
        setLoadingConv(true);
        setConversationId(id);
        setSidebarOpen(false);
        const { data: rows } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });
        setMessages(
            (rows ?? []).map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content as string,
            }))
        );
        setLoadingConv(false);
    }

    async function deleteConversation(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        await supabase.from('conversations').delete().eq('id', id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (id === conversationId) {
            newConversation();
        }
    }

    async function sendMessage() {
        if (!input.trim() || isStreaming) return;

        const wasNew = !conversationId;
        const userMessage: Message = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages([...newMessages, { role: 'assistant', content: '' }]);
        const sentText = userMessage.content;
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
            const memoriesUsed = Number(res.headers.get('X-Memories-Used') || '0');
            if (returnedId && returnedId !== conversationId) {
                setConversationId(returnedId);
            }

            // Keep the sidebar in sync.
            if (returnedId) {
                const snippet =
                    sentText.length > 40 ? sentText.slice(0, 40) + '…' : sentText;
                const now = new Date().toISOString();
                setConversations((prev) => {
                    const without = prev.filter((c) => c.id !== returnedId);
                    const existing = prev.find((c) => c.id === returnedId);
                    return [
                        {
                            id: returnedId,
                            title: wasNew ? snippet : existing?.title ?? snippet,
                            updatedAt: now,
                        },
                        ...without,
                    ];
                });
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
                    copy[copy.length - 1] = {
                        role: 'assistant',
                        content: accumulated,
                        memories: memoriesUsed,
                    };
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

    async function copyMessage(text: string, i: number) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(i);
            setTimeout(() => setCopiedIndex((c) => (c === i ? null : c)), 1500);
        } catch {
            // ignore
        }
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <ThreadsBackground intensity="ambient" />

            {/* Sidebar */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-30 w-72 shrink-0 border-r border-border/40 bg-background/80 backdrop-blur-md flex flex-col transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                <div className="px-5 py-5 flex items-center justify-between">
                    <Link
                        href="/chat"
                        className="flex items-center gap-2 font-display italic text-2xl text-foreground/90"
                    >
                        loom <span className="text-primary/50 text-xs">✦</span>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="px-3">
                    <button
                        onClick={newConversation}
                        disabled={isStreaming}
                        className="w-full text-left px-3 py-2.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground/80 flex items-center gap-2 disabled:opacity-40"
                    >
                        <span className="text-primary">＋</span> new thread
                    </button>
                </div>

                <div className="mt-4 px-3 text-[10px] uppercase tracking-[0.2em] text-foreground/35">
                    threads
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {conversations.length === 0 && (
                        <p className="px-3 py-2 text-xs text-foreground/35">
                            no threads yet.
                        </p>
                    )}
                    {conversations.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => openConversation(c.id)}
                            className={`group w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                                c.id === conversationId
                                    ? 'bg-primary/10 text-foreground'
                                    : 'hover:bg-foreground/5 text-foreground/70'
                            }`}
                        >
                            <span className="flex-1 truncate text-sm">{c.title}</span>
                            <span
                                onClick={(e) => deleteConversation(c.id, e)}
                                role="button"
                                aria-label="delete thread"
                                className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-destructive text-xs transition-all shrink-0"
                            >
                                ✕
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="px-5 py-4 border-t border-border/40">
                    <Link
                        href="/profile"
                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/55 hover:text-primary transition-colors"
                    >
                        what i remember →
                    </Link>
                </div>
            </aside>

            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-20 bg-black/30 md:hidden"
                />
            )}

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="px-5 py-4 md:px-10 flex items-center justify-between border-b border-border/30 backdrop-blur-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        aria-label="open threads"
                        className="md:hidden text-foreground/70 text-xl"
                    >
                        ☰
                    </button>
                    <span className="font-display italic text-lg text-foreground/70 md:hidden">
                        loom
                    </span>
                    <div className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-foreground/35">
                        {conversationId ? 'a thread in progress' : 'a new thread'}
                    </div>
                    <button
                        onClick={newConversation}
                        disabled={isStreaming || messages.length === 0}
                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/55 hover:text-primary transition-colors disabled:opacity-30"
                    >
                        new
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto px-6 md:px-12">
                    <div className="max-w-2xl mx-auto py-10 space-y-8">
                        {loadingConv ? (
                            <div className="pt-24 flex justify-center">
                                <span className="loom-dots inline-flex"><span /><span /><span /></span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="pt-20 animate-fade-up">
                                <p className="font-display italic text-3xl text-gradient mb-3 leading-tight">
                                    tell me about your day.
                                </p>
                                <p className="text-sm text-foreground/40">
                                    or anything else. i&apos;m listening, and i&apos;ll remember.
                                </p>
                            </div>
                        ) : (
                            messages.map((m, i) => {
                                const isUser = m.role === 'user';
                                const isStreamingThis =
                                    isStreaming &&
                                    i === messages.length - 1 &&
                                    m.role === 'assistant';

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
                                    <div key={i} className="group space-y-2 animate-fade-up">
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary/60">
                                            <span>loom</span>
                                            <span className="rule-fade flex-1" />
                                            {m.content && (
                                                <button
                                                    onClick={() => copyMessage(m.content, i)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/40 hover:text-primary normal-case tracking-normal text-[11px]"
                                                >
                                                    {copiedIndex === i ? 'copied' : 'copy'}
                                                </button>
                                            )}
                                        </div>
                                        {m.memories ? (
                                            <div className="text-[11px] italic text-primary/55 flex items-center gap-1.5">
                                                <span>✦</span>
                                                weaving in {m.memories}{' '}
                                                {m.memories === 1 ? 'thing' : 'things'} i remember
                                            </div>
                                        ) : null}
                                        <div className="text-[15px] text-foreground/90 prose-loom">
                                            {m.content ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {m.content}
                                                </ReactMarkdown>
                                            ) : isStreamingThis ? (
                                                <span
                                                    className="loom-dots inline-flex items-center"
                                                    aria-label="thinking"
                                                >
                                                    <span /><span /><span />
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        )}
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
                            loom remembers what matters · enter to send · shift+enter for a new line
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
