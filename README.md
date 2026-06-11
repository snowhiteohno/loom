<div align="center">

# ✦ Loom

### An AI that quietly remembers your life.

Loom is a calm, editorial chat companion for students — talk to it like a
thoughtful advisor, and it weaves what matters about you into a lasting memory
that quietly shapes every future conversation.

<br />

<img src="public/preview.png" alt="Loom" width="840" />

<br />
<br />

[**Live demo →**](https://loom-eqtv.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20pgvector-3FCF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## What makes it different

Most chatbots forget you the moment a conversation ends. Loom doesn't. After
each exchange it quietly distills the **durable facts** worth keeping, embeds
them, and pulls the relevant ones back into context next time — so it grows to
know you instead of starting from zero every session. And it never lists your
life back at you; the memory just shapes how it replies.

## Features

🧠 **Living memory** — extracts durable facts from each chat, embeds them with
Gemini, and retrieves the most relevant via vector similarity. Near-duplicates
are deduped so the memory stays clean.

✦ **Transparent recall** — when a reply leans on memory, Loom shows it
("*weaving in 3 things I remember*"). No hidden profiling.

🧵 **Threads** — a sidebar of past conversations, titled by context. Switch,
start fresh, or forget any of them.

🔍 **Memory inspector** — the `/profile` page surfaces everything Loom has
learned, grouped by category and fully searchable. Forget anything, anytime.

⌘ **Command palette** — `⌘K` / `Ctrl+K` to jump between threads and actions.

🎨 **Crafted experience** — a warm "quiet editorial" palette, drifting ambient
light, light/dark themes, streaming replies with **stop** & **regenerate**, and
full markdown rendering.

🔐 **Real auth** — GitHub OAuth via Supabase, with row-level security and
middleware-refreshed sessions.

## How the memory works

```
 you send a message
        │
        ▼
 retrieve relevant memories ──► vector search (pgvector) over your stored facts
        │
        ▼
 inject them into the system prompt ──► Gemini streams a reply
        │
        ▼
 after the reply: extract durable facts ──► embed ──► dedupe ──► store
```

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Framework    | Next.js (App Router), React, TypeScript                       |
| Auth & data  | Supabase — GitHub OAuth, Postgres, `pgvector`, RLS            |
| AI           | Google Gemini — `gemini-2.5-flash` + `gemini-embedding-001`   |
| Styling      | Tailwind CSS v4, custom OKLCH palette                         |
| Hosting      | Vercel                                                        |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

For GitHub login: add your app URL to **Supabase → Authentication → URL
Configuration** (Site URL + Redirect URLs), and point your GitHub OAuth app's
callback at `https://<project-ref>.supabase.co/auth/v1/callback`.

## Project structure

```
src/
├─ app/
│  ├─ page.tsx            # signed-in landing
│  ├─ login/              # GitHub OAuth entry
│  ├─ auth/callback/      # OAuth code exchange
│  ├─ chat/               # the conversation + thread sidebar
│  ├─ profile/            # memory inspector
│  └─ api/chat/           # streaming chat + memory pipeline
├─ components/            # ambient background, command palette, theme, toasts
└─ lib/
   ├─ memory.ts           # extract / embed / dedupe / retrieve
   └─ supabase/           # browser, server & middleware clients
```

## Deploy

Deployed on [Vercel](https://vercel.com): set the three environment variables in
project settings, and every push to `main` ships automatically.

<div align="center">
<sub>made with care · 2026</sub>
</div>
