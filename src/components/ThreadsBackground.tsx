'use client';

import { useEffect, useRef } from 'react';

type Props = {
    /** 'ambient' = faint, behind everything. 'hero' = more visible, for landing. */
    intensity?: 'ambient' | 'hero';
};

/**
 * Loom's signature: softly drifting woven threads rendered on a canvas.
 * Warm terracotta + neutral filaments that read on both light and dark themes.
 */
export default function ThreadsBackground({ intensity = 'ambient' }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        const hero = intensity === 'hero';
        const baseAlpha = hero ? 0.5 : 0.28;
        const threadCount = hero ? 26 : 16;

        let width = 0;
        let height = 0;
        let dpr = 1;

        function resize() {
            if (!canvas) return;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        // Warm filament palette (alpha applied per-frame).
        const colors = [
            [200, 120, 75], // terracotta
            [170, 140, 110], // sand
            [120, 110, 120], // muted violet-grey
        ];

        type Thread = {
            y: number;
            amp: number;
            len: number;
            speed: number;
            phase: number;
            color: number[];
            weight: number;
        };

        const threads: Thread[] = Array.from({ length: threadCount }, (_, i) => ({
            y: (i + 0.5) / threadCount,
            amp: 18 + ((i * 37) % 60),
            len: 0.7 + ((i * 53) % 30) / 100,
            speed: 0.12 + ((i * 17) % 20) / 100,
            phase: (i * 1.7) % (Math.PI * 2),
            color: colors[i % colors.length],
            weight: 0.6 + ((i * 13) % 12) / 10,
        }));

        let t = 0;
        let raf = 0;

        function draw() {
            ctx!.clearRect(0, 0, width, height);

            for (const th of threads) {
                const yBase = th.y * height;
                const [r, g, b] = th.color;
                ctx!.beginPath();
                ctx!.lineWidth = th.weight;

                const steps = 64;
                for (let s = 0; s <= steps; s++) {
                    const x = (s / steps) * width;
                    const wave =
                        Math.sin(s / steps * Math.PI * 2 * th.len + t * th.speed + th.phase) *
                        th.amp;
                    const wave2 =
                        Math.cos(s / steps * Math.PI * 1.3 - t * th.speed * 0.6 + th.phase) *
                        th.amp *
                        0.4;
                    const y = yBase + wave + wave2;
                    if (s === 0) ctx!.moveTo(x, y);
                    else ctx!.lineTo(x, y);
                }

                // Fade the line in and out across its length via a gradient.
                const grad = ctx!.createLinearGradient(0, 0, width, 0);
                grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
                grad.addColorStop(0.5, `rgba(${r},${g},${b},${baseAlpha})`);
                grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx!.strokeStyle = grad;
                ctx!.stroke();
            }

            if (!reduced) {
                t += 0.016;
                raf = requestAnimationFrame(draw);
            }
        }
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(raf);
        };
    }, [intensity]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
        />
    );
}
