'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
    return () => observer.disconnect();
}

function isDark() {
    return document.documentElement.classList.contains('dark');
}

export default function ThemeToggle() {
    const dark = useSyncExternalStore(subscribe, isDark, () => false);

    function toggle() {
        const next = !isDark();
        document.documentElement.classList.toggle('dark', next);
        try {
            localStorage.setItem('loom-theme', next ? 'dark' : 'light');
        } catch {
            // ignore storage failures
        }
    }

    return (
        <button
            onClick={toggle}
            aria-label="toggle theme"
            title={dark ? 'switch to light' : 'switch to dark'}
            className="text-base leading-none text-foreground/55 hover:text-primary transition-colors"
        >
            {dark ? '☾' : '☀'}
        </button>
    );
}
