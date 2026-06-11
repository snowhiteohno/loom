import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AmbientBackground from '@/components/AmbientBackground'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = user.user_metadata?.name?.split(' ')[0]
    || user.user_metadata?.user_name
    || user.email?.split('@')[0]
    || 'you'

  return (
    <main className="relative min-h-screen flex items-center justify-center px-8 md:px-16 py-16 md:py-20 overflow-hidden">
      <AmbientBackground intensity="hero" />
      <div className="absolute top-12 left-12 md:top-16 md:left-20 font-display italic text-sm text-foreground/55">
        you&apos;re in.
      </div>

      <div className="max-w-2xl text-center space-y-8 relative animate-fade-up">
        <h1 className="font-display italic text-6xl md:text-8xl font-light leading-none tracking-tight">
          hi, {name}<span className="text-primary">.</span>
        </h1>

        <p className="font-display text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-md mx-auto">
          your loom is ready,
          <br />
          whenever you are.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <span className="h-px w-10 sm:w-12 bg-foreground/20"></span>
          <span className="text-primary/60 text-sm shrink-0">✦</span>
          <span className="h-px w-10 sm:w-12 bg-foreground/20"></span>
        </div>

        <Link
          href="/chat"
          className="group relative font-display italic text-lg text-foreground/80 hover:text-primary transition-colors duration-500 cursor-pointer inline-block tracking-normal hover:tracking-wide"
        >
          enter loom
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"></span>
        </Link>
      </div>

      <div className="absolute bottom-12 right-12 md:bottom-16 md:right-20 font-display italic text-sm text-foreground/55">
        signed in via github
      </div>
    </main>
  )
}