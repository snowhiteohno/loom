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

const CATEGORY_ORDER = ['profile_base', 'academic', 'career', 'personal'];

export default function Profile({
    initialMemories,
}: {
    initialMemories: Memory[];
}) {
    const [memories, setMemories] = useState<Memory[]>(initialMemories);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const supabase = createClient();

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

    return (
        <div className="min-h-screen bg-background">
            <header className="px-8 py-6 md:px-12 md:py-8 flex items-center justify-between">
                <Link
                    href="/chat"
                    className="font-display italic text-2xl text-foreground/90 hover:text-foreground transition-colors"
                >
                    loom
                </Link>
                <Link
                    href="/chat"
                    className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground transition-colors"
                >
                    ← back to chat
                </Link>
            </header>

            <main className="px-8 md:px-12 pb-24">
                <div className="max-w-2xl mx-auto pt-12">
                    <h1 className="font-display italic text-3xl text-foreground/90 mb-3">
                        what i remember about you
                    </h1>
                    <p className="text-sm text-foreground/50 mb-16 leading-relaxed">
                        everything loom has learned from your conversations. forget anything you don&apos;t want me to keep.
                    </p>

                    {memories.length === 0 ? (
                        <div className="text-center pt-12">
                            <p className="font-display italic text-xl text-foreground/40">
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
                                return (
                                    <section key={cat}>
                                        <h2 className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-4">
                                            {CATEGORY_LABELS[cat]}
                                        </h2>
                                        <ul className="space-y-3">
                                            {items.map((m) => (
                                                <li
                                                    key={m.id}
                                                    className="flex items-start justify-between gap-6 text-base text-foreground/85 leading-relaxed"
                                                >
                                                    <span className="flex-1">{m.content}</span>
                                                    <button
                                                        onClick={() => deleteMemory(m.id)}
                                                        disabled={deletingId === m.id}
                                                        className="text-[10px] uppercase tracking-[0.2em] text-foreground/25 hover:text-foreground/80 transition-colors disabled:opacity-30 flex-shrink-0 pt-1"
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
                </div>
            </main>
        </div>
    );
}