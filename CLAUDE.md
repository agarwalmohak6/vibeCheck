# VibeCheck (Paisa) Developer Guide

## Commands
* Run development server: `npm run dev`
* Build application: `npm run build`
* Run linter: `npm run lint`

## Tech Stack & Conventions
* **Core**: Next.js 16 (App Router), React 19, TypeScript
* **Styling**: Tailwind CSS v4 (with PostCSS)
* **Backend/Database**: Supabase client (`lib/supabase.ts`) and Admin SDK (`services/server/supabase-admin.ts`).
  * *Crucial*: If Supabase env variables are not set, both client and server automatically fall back to **in-memory/mock state storage** (stored in `globalThis`).
* **Payments**: Razorpay. Falls back to mock payments when `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=true` or in development mode if not explicitly set to false.

## Code Guidelines
* **Breaking Next.js Changes**: Always read Next.js rules in `@AGENTS.md` before changing routing/APIs.
* **Emoji Safe Spans**: Next.js gradients/text-fill can break system emoji rendering. Wrap pure text in a span (e.g. `<span className="gradient-text">`) and leave emojis outside or wrapped in a plain `.emoji` span.
* **Comments**: Preserve all existing comments and docstrings.
* **No Scratchpads**: Never create, open, write to, or read scratchpad files (such as `scratchpad.md`, temporary notes, or developer logs). All plans, tasks, and notes should remain in direct agent memory or the authorized files.

