# Loom

*An AI that quietly remembers your life.*

Loom is a calm, editorial chat companion for a college student. You talk to it
like a thoughtful advisor; it weaves what matters about you into a durable
memory and lets that quietly shape every future conversation — without ever
listing your life back at you.

## Features

- **Conversational memory** — Loom extracts durable facts from each exchange,
  embeds them, and retrieves the relevant ones to inform later replies. When a
  reply draws on memory, it tells you ("weaving in 3 things I remember").
- **Threads** — a sidebar of past conversations you can revisit, switch between,
  or forget.
- **A memory inspector** — the `/profile` page shows everything Loom has learned,
  grouped by category and searchable. Forget anything, anytime.
- **Command palette** — `⌘K` / `Ctrl+K` to jump between threads and actions.
- **Crafted UI** — a warm "quiet editorial" palette, drifting ambient light,
  light/dark themes, streaming replies with stop & regenerate, and markdown
  rendering.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Supabase](https://supabase.com) — GitHub OAuth, Postgres, pgvector, RLS
- [Google Gemini](https://ai.google.dev) — chat (`gemini-2.5-flash`) and
  embeddings (`gemini-embedding-001`)
- Tailwind CSS v4

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

For GitHub login to work, add your app URL to **Supabase → Authentication →
URL Configuration** (Site URL + Redirect URLs), and point your GitHub OAuth
app's callback at `https://<project-ref>.supabase.co/auth/v1/callback`.

## Deploy

Deployed on [Vercel](https://vercel.com). Set the three environment variables
in the project settings, then every push to `main` ships automatically.
