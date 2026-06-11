'use client';

import { useEffect, useState } from 'react';

type Toast = { id: number; message: string };

let counter = 0;

/** Fire a toast from anywhere on the client. */
export function toast(message: string) {
    window.dispatchEvent(new CustomEvent('loom-toast', { detail: message }));
}

export default function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        function onToast(e: Event) {
            const message = (e as CustomEvent<string>).detail;
            const id = ++counter;
            setToasts((prev) => [...prev, { id, message }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 2400);
        }
        window.addEventListener('loom-toast', onToast);
        return () => window.removeEventListener('loom-toast', onToast);
    }, []);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className="animate-fade-up rounded-full border border-border bg-card/90 backdrop-blur-md px-4 py-2 text-sm text-foreground/85 shadow-lg flex items-center gap-2"
                >
                    <span className="text-primary text-xs">✦</span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
