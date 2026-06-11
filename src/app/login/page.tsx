'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const handleGitHubSignIn = async () => {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center px-8 md:px-16 py-16 md:py-20 overflow-hidden">
            {/* Scattered sparkles, staggered twinkles */}
            <div className="absolute top-32 left-[18%] text-primary/40 text-2xl select-none animate-twinkle" style={{ animationDelay: '0s' }}>✦</div>
            <div className="absolute bottom-40 right-[22%] text-primary/30 text-xl select-none animate-twinkle" style={{ animationDelay: '2s' }}>✦</div>
            <div className="absolute top-1/3 right-[14%] text-primary/35 text-base select-none animate-twinkle" style={{ animationDelay: '4s' }}>✦</div>
            <div className="absolute bottom-1/3 left-[15%] text-primary/25 text-sm select-none animate-twinkle" style={{ animationDelay: '3s' }}>✦</div>

            {/* Top-left personal note */}
            <div className="absolute top-12 left-12 md:top-16 md:left-20 font-display italic text-sm text-foreground/55">
                a quiet place, for you.
            </div>

            {/* Main */}
            <div className="max-w-2xl text-center space-y-8 relative animate-fade-up">
                <h1 className="font-display italic text-8xl md:text-[11rem] font-light leading-none tracking-tight text-gradient">
                    Loom
                </h1>

                <p className="font-display text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-md mx-auto">
                    an ai that quietly
                    <br />
                    remembers your life.
                </p>

                {/* Hairline divider with center sparkle */}
                <div className="flex items-center justify-center gap-4 pt-2">
                    <span className="h-px w-10 sm:w-12 bg-foreground/20"></span>
                    <span className="text-primary/60 text-sm shrink-0">✦</span>
                    <span className="h-px w-10 sm:w-12 bg-foreground/20"></span>
                </div>

                {/* Premium hover link */}
                <button
                    onClick={handleGitHubSignIn}
                    className="group relative font-display italic text-lg text-foreground/80 hover:text-primary transition-colors duration-500 cursor-pointer inline-block tracking-normal hover:tracking-wide"
                >
                    continue with github
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"></span>
                </button>
            </div>

            {/* Bottom-right signature */}
            <div className="absolute bottom-12 right-12 md:bottom-16 md:right-20 font-display italic text-sm text-foreground/55">
                made with care, 2026
            </div>
        </main>
    )
}