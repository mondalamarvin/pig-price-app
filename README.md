# Presyo

Crowd-sourced pig prices (live weight and meat) by town and province, with accuracy voting.
Vite + React + TypeScript + Tailwind, Supabase for database and auth.

## Setup

1. Create a project at https://supabase.com.
2. SQL Editor: fresh project, run `supabase/schema.sql`. Existing project, run `supabase/migration-002-no-auth.sql` once.
3. (No login or Anonymous sign-ins needed.)
4. Project Settings > API: copy the project URL and anon key.
5. Run:

   cp .env.example .env # then paste the two values
   npm install
   npm run dev

## Provinces and towns

The dropdowns come from the `psgc` npm package (Philippine Standard Geographic Code), loaded lazily by `src/lib/psgc.ts`.
If the dropdowns come up empty or everything lands under Metro Manila, open the browser console: the file logs which
fields it found, and the `PARENT_KEYS` list at the top is the one thing to adjust.

## How it works

- No login. Each browser gets a random voter id (localStorage), one vote per id per price; tapping again removes it.
- One row per town. Posting a price for a town that already has one updates it, records the change in `price_history`, and shows a green arrow up / red arrow down with the amount.
- Posting the same price again just refreshes "updated"; a changed price also resets that town's votes.
- Tables are read-only to the public. All writes go through the `submit_price` and `cast_vote` functions.
- "Confirmed by neighbors" at +10 net votes, "Disputed" at 0 or below.

## Known limits (fine for now, fix before launch)

- Anyone can post any price or vote many times by clearing storage. Add login, rate limiting or CAPTCHA later.

## Using the real shadcn/ui

The components in `src/components/ui` are small shadcn-style versions. To switch, run `npx shadcn@latest init`,
then `npx shadcn@latest add button select input dialog badge` and swap the imports.
