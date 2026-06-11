'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type Command = {
    id: string;
    label: string;
    hint?: string;
    run: () => void;
};

type Props = {
    commands: Command[];
};

/**
 * A Cmd/Ctrl+K command palette. Pass in the actions (and thread jumps) that
 * make sense for the current page.
 */
export default function CommandPalette({ commands }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const openRef = useRef(false);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    function openPalette() {
        setQuery('');
        setActive(0);
        setOpen(true);
    }

    function close() {
        setOpen(false);
    }

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (openRef.current) close();
                else openPalette();
            } else if (e.key === 'Escape') {
                close();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Focus the input once the palette is shown (no state writes here).
    useEffect(() => {
        if (open) requestAnimationFrame(() => inputRef.current?.focus());
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter((c) => c.label.toLowerCase().includes(q));
    }, [commands, query]);

    function choose(cmd: Command | undefined) {
        if (!cmd) return;
        close();
        cmd.run();
    }

    function onInputKey(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(filtered[active]);
        }
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 bg-black/30 backdrop-blur-sm animate-fade-in"
            onClick={close}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 border-b border-border/60">
                    <span className="text-primary/60 text-sm">✦</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onInputKey}
                        placeholder="search threads, jump anywhere…"
                        className="flex-1 bg-transparent outline-none py-3.5 text-[15px] placeholder:text-foreground/30"
                    />
                    <kbd className="text-[10px] uppercase tracking-wider text-foreground/35 border border-border rounded px-1.5 py-0.5">
                        esc
                    </kbd>
                </div>
                <ul className="max-h-80 overflow-y-auto py-2">
                    {filtered.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-foreground/40">
                            nothing matches.
                        </li>
                    )}
                    {filtered.map((c, i) => (
                        <li key={c.id}>
                            <button
                                onMouseEnter={() => setActive(i)}
                                onClick={() => choose(c)}
                                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                    i === active
                                        ? 'bg-primary/10 text-foreground'
                                        : 'text-foreground/75'
                                }`}
                            >
                                <span className="truncate text-sm">{c.label}</span>
                                {c.hint && (
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/35 shrink-0">
                                        {c.hint}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
