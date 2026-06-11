'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Memory = {
    id: string;
    content: string;
    category: string;
    created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
    profile_base: 'basics',
    academic: 'academic',
    career: 'career',
    personal: 'personal',
};

// A distinct hue per category so the page reads at a glance.
const CATEGORY_ACCENT: Record<string, string> = {
    profile_base: 'oklch(0.62 0.13 50)',
    academic: 'oklch(0.6 0.12 250)',
    career: 'oklch(0.6 0.13 150)',
    personal: 'oklch(0.62 0.14 350)',
};

const CATEGORY_ORDER = ['profile_base', 'academic', 'career', 'personal'];

export default function Profile({
    initialMemories,
}: {
    initialMemories: Memory[];
}) {
    const [memories, setMemories] = useState<Memory[]>(initialMemories);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const supabase = createClient();

    async function signOut() {
        await supabase.auth.signOut();
        window.location.assign('/login');
    }

    async function deleteMemory(id: string) {
        setDeletingId(id);
        const { error } = await supabase.from('memories').delete().eq('id', id);
        if (!error) {
            setMemories((prev) => prev.filter((m) => m.id !== id));
        }
        setDeletingId(null);
    }

    const grouped: Record<string, Memory[]> = {};
    for (const cat of CATEGORY_ORDER) {
        grouped[cat] = memories.filter((m) => m.category === cat);
    }

    const total = memories.length;

    return (
        <div className="min-h-screen">
            <header className="px-8 py-5 md:px-12 md:py-6 flex items-center justify-between border-b border-border/40 backdrop-blur-sm sticky top-0 z-10">
                <Link
                    href="/chat"
                    className="flex items-center gap-3 font-display italic text-2xl text-foreground/90 hover:text-foreground transition-colors"
                >
                    loom
                    <span className="text-primary/50 text-xs">✦</span>
                </Link>
                <Link
                    href="/chat"
                    className="text-[10px] uppercase tracking-[0.2em] text-foreground/55 hover:text-primary transition-colors"
                >
                    ← back to chat
                </Link>
            </header>

            <main className="px-8 md:px-12 pb-24">
                <div className="max-w-2xl mx-auto pt-14 animate-fade-up">
                    <h1 className="font-display italic text-4xl text-gradient mb-3 leading-tight">
                        what i remember about you
                    </h1>
                    <p className="text-sm text-foreground/50 mb-3 leading-relaxed">
                        everything loom has learned from your conversations. forget anything you don&apos;t want me to keep.
                    </p>
                    {total > 0 && (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/35 mb-14">
                            {total} {total === 1 ? 'memory' : 'memories'} kept
                        </p>
                    )}

                    {memories.length === 0 ? (
                        <div className="text-center pt-20 animate-fade-in">
                            <div className="text-primary/30 text-3xl mb-4 animate-twinkle">✦</div>
                            <p className="font-display italic text-2xl text-foreground/45">
                                i haven&apos;t learned anything yet.
                            </p>
                            <p className="text-sm text-foreground/30 mt-3">
                                keep chatting, i&apos;ll start to know you.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {CATEGORY_ORDER.map((cat) => {
                                const items = grouped[cat];
                                if (items.length === 0) return null;
                                const accent = CATEGORY_ACCENT[cat];
                                return (
                                    <section key={cat}>
                                        <h2 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45 mb-4">
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{ backgroundColor: accent }}
                                            />
                                            {CATEGORY_LABELS[cat]}
                                            <span className="text-foreground/25">· {items.length}</span>
                                        </h2>
                                        <ul className="space-y-2.5">
                                            {items.map((m) => (
                                                <li
                                                    key={m.id}
                                                    className="group relative flex items-start justify-between gap-5 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-[15px] text-foreground/85 leading-relaxed transition-all hover:border-border hover:bg-card/70 hover:shadow-sm"
                                                >
                                                    <span
                                                        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                                                        style={{ backgroundColor: accent }}
                                                    />
                                                    <span className="flex-1 pl-2">{m.content}</span>
                                                    <button
                                                        onClick={() => deleteMemory(m.id)}
                                                        disabled={deletingId === m.id}
                                                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/25 hover:text-destructive transition-colors disabled:opacity-30 flex-shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    >
                                                        {deletingId === m.id ? 'forgetting' : 'forget'}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-24 pt-8 border-t border-border/50">
                        <button
                            onClick={signOut}
                            className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 hover:text-destructive transition-colors"
                        >
                            sign out
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}