# Sudoku Mind Garden

Sudoku Mind Garden is a premium, gamified Sudoku web app built as a daily brain-training platform rather than a plain puzzle site. The product combines calm, premium UI with retention mechanics like XP, coins, streaks, theme unlocks, Daily Challenge, and an AI Coach that explains moves in human language.

## Why this is valuable

- It creates a reason to come back every day through daily seeds, streaks, progression, and cosmetics.
- It feels like a real startup MVP, not a coursework clone: there is retention, monetization framing, personalization, and leaderboard structure.
- It is mobile-first and polished enough to demo as a serious product direction.

## Built with

- Next.js App Router
- TypeScript
- TailwindCSS
- Framer Motion
- Supabase Auth + Database ready integration

## Core features in this MVP

- Real Sudoku generator with unique-solution puzzles
- Four difficulties: easy, medium, hard, expert
- Daily Challenge with shared UTC seed
- XP, coins, level progression, streak logic
- Notes mode, hint, undo/redo, pause, local save/resume
- Soft mistake tracking and live conflict highlighting
- Theme shop with `Base`, `Ocean`, and `Sunny Blue`
- Hybrid AI Coach endpoint at `/api/coach/explain` with OpenAI + local fallback
- Email/password auth with Supabase confirmation flow
- Global leaderboard surfaces with Supabase-ready queries and local fallbacks
- 3D Sudoku teaser hook for a future premium mode

## Routes

- `/` progression map
- `/play/[nodeId]` campaign level play screen
- `/super-level` 4-layer 3D Sudoku challenge
- `/leaderboard` XP leaderboard
- `/shop` Brainy cosmetics
- `/profile` player overview
- `/login` sign-in
- `/register` sign-up

## Local setup

This workspace currently does not have a package manager binary installed, so the repo was scaffolded manually around a `pnpm` workflow.

1. Install `pnpm`
2. Copy `.env.example` to `.env.local`
3. Add your Supabase URL, publishable key, app URL, and AI provider key
4. Run `pnpm install`
5. Run `pnpm dev`

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_COACH_MODEL=gpt-4.1
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

## AI Coach setup

1. Open `.env.local`
2. Add either an OpenAI key or an OpenRouter key.

```bash
# Option A — OpenAI
OPENAI_API_KEY=sk-...
OPENAI_COACH_MODEL=gpt-4.1

# Option B — OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

3. Restart `pnpm dev` after editing env vars
4. Verify the coach route locally:

```bash
curl -X POST http://localhost:3000/api/coach/explain \
  -H "Content-Type: application/json" \
  --data '{"grid":[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]],"row":0,"col":2,"value":4,"given":false}'
```

If the live provider is missing or fails, the app automatically falls back to the local rule-based coach instead of breaking the UI.

## Supabase setup

1. Create a new Supabase project for this app
2. Run the SQL from [supabase/schema.sql](./supabase/schema.sql)
3. In `Authentication -> URL Configuration`, set:

```text
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/auth/confirm
```

4. Keep Email provider enabled and email confirmation turned on
5. In Supabase Auth email templates, update the confirmation URL to:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/profile
```

6. Set your Site URL and Redirect URLs to the deployed frontend origin in production

## Product direction

- `Ocean` theme is the calm premium unlock
- `Sunny Blue` is the more playful unlock without using restricted branding
- `Upgrade to Pro` is intentionally UI-only in this MVP to signal monetization direction without pulling Stripe into the first cut
- `3D Sudoku` is intentionally left as a teaser/stretch path after core gameplay and retention loops

## Production env

- Add the same AI env values to your hosting provider's server environment settings.
- `OPENAI_API_KEY` and `OPENROUTER_API_KEY` must stay server-only and should never be exposed through `NEXT_PUBLIC_*`.

## Notes

- Cloud sync, auth, and leaderboards depend on a configured Supabase project and the environment variables above.
- AI Coach uses local Sudoku analysis for grounding, then asks OpenAI or OpenRouter to explain the move in natural language.
