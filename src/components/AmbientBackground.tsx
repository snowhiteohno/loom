'use client';

type Props = {
    /** 'ambient' = faint, behind everything. 'hero' = more present, for landing. */
    intensity?: 'ambient' | 'hero';
};

/**
 * Loom's calm signature: large, softly drifting pools of warm light.
 * Pure CSS, GPU-cheap, and far less busy than moving lines. Reads on both
 * light and dark themes; pauses under prefers-reduced-motion (see globals.css).
 */
export default function AmbientBackground({ intensity = 'ambient' }: Props) {
    const hero = intensity === 'hero';

    const blobs = [
        {
            color: 'oklch(0.66 0.15 50)', // terracotta
            size: hero ? '46rem' : '34rem',
            top: '-12%',
            left: '8%',
            anim: 'aurora-a',
            o: hero ? 0.32 : 0.16,
        },
        {
            color: 'oklch(0.72 0.11 85)', // warm gold
            size: hero ? '40rem' : '30rem',
            top: '20%',
            left: '62%',
            anim: 'aurora-b',
            o: hero ? 0.28 : 0.14,
        },
        {
            color: 'oklch(0.64 0.12 18)', // soft rose
            size: hero ? '38rem' : '28rem',
            top: '58%',
            left: '24%',
            anim: 'aurora-c',
            o: hero ? 0.24 : 0.12,
        },
    ];

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            {blobs.map((b, i) => (
                <div
                    key={i}
                    className="aurora-blob"
                    style={{
                        width: b.size,
                        height: b.size,
                        top: b.top,
                        left: b.left,
                        opacity: b.o,
                        background: `radial-gradient(circle at center, ${b.color}, transparent 68%)`,
                        animationName: b.anim,
                    }}
                />
            ))}
        </div>
    );
}
