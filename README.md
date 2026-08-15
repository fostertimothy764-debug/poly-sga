# Poly SGA — Baltimore Polytechnic Institute

Student Government Association website for Baltimore Polytechnic Institute. Next.js + Prisma + PostgreSQL (Neon) + Tailwind.

## Features

- **Welcome flow** — first-time visitors pick their class (2027–2030 or guest); home/announcements/events get tailored to that audience. Officers can also sign in straight from the welcome page.
- **Public site** — Home, announcements, events, **clubs**, team roster (with photos), public idea board.
- **Public ideas with upvotes** — anyone can submit and upvote (no downvotes); auto-upvotes your own; one vote per browser; sort by Top or Newest; filter by category and inbox.
- **Targeted suggestions** — when submitting an idea you pick who it's for: SGA, a specific class, or a specific club. Class/club suggestions go to that group's inbox **AND** the SGA inbox; SGA-only suggestions live solely in the SGA inbox. Public list shows everyone what was sent where.
- **Suggestion redirect** — SGA admins can forward an SGA-only suggestion to a class or club inbox (it stays in the SGA inbox too).
- **Per-officer logins** — every SGA officer has their own username/password and can edit their own team profile (photo, bio, role, name, grade) but not anyone else's.
- **Admin tiers** — President + Chief of Staff + site admin are *SGA admins* (full access: manage team roster, manage clubs, redirect suggestions). Other SGA exec are *SGA officers* (post schoolwide + edit own profile + read inbox). Class officers post to their class only. Club officers post to their club only.
- **Username-based login** — login uses a short username (e.g. `luke`) instead of an email. Editable from the profile page in seconds.
- **Stays signed in** — JWT cookie sessions last **30 days** (cleared by signing out, server-side). Done in the backend; nothing extra to do on the frontend.
- **Clubs** — public clubs index + per-club detail page with announcements, upcoming events, and a "suggest something" shortcut. Admins can add/edit/delete clubs from the dashboard.
- **Transparency suite** — five public pages backed by full CRUD admin tooling:
  - `/minutes` — chronological meeting record (general/executive/emergency), with attendees, agenda, **highlighted decisions**, and per-meeting action items. Search + date-range + type filter.
  - `/initiatives` — kanban board (Proposed → In progress → Completed → Archived). Students can submit new initiative ideas; admins review them in a separate queue and can promote to a real initiative in one click.
  - `/budget` — semester selector with summary stat cards, SVG pie + bar charts, category accordion of line items, and a prominent **last updated** stamp.
  - `/accountability` — aggregated view of every action item from every meeting, with per-officer completion rates, overdue highlighting, and filters by officer / status / date / category.
  - `/voice` — anonymous-or-named submissions of concerns, questions, and suggestions. Each gets a **ticket code** (e.g. `V-A3X9B`) for status lookup at `/voice/<TICKET>`. Upvote system, public resolved feed, admin can respond, mark addressed/declined, or hide from public.
- **Auth** — JWT cookie sessions, bcrypt-hashed passwords, server-side scope enforcement on every API route.
- **Minimalist UI** — Plus Jakarta Sans + Fraunces typography, orange/navy Poly accents, subtle motion, mobile-first.

## Quick start

```bash
cd sga-website
npm install
npm run setup     # pushes the Postgres schema and seeds real officer accounts (no demo content by default)
npm run dev
```

Open http://localhost:3000.

> Schema changed since v1 — if you ran the older seed, delete `prisma/dev.db*` first or run `npm run setup` (which calls `prisma db push`, which will reset).

## Officer logins

Officer accounts are defined in [`prisma/seed.ts`](prisma/seed.ts): 8 SGA exec roles (President, Chief of Staff, Upper/Lower VP, Secretary, Treasurer, 2 Historians) plus 4 class-officer accounts (`class27`–`class30`). Passwords are **never hardcoded** — `npm run db:seed` generates a fresh random password per account and prints the full username/password list to the console once, on that run only. Save that output somewhere safe; it isn't stored anywhere else.

The site-admin account's username/password come from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) — set your own values there before seeding, there is no default.

Each user can change their own username and password any time from `/admin/profile` after signing in.

Set `SEED_SAMPLE_CONTENT=true` when seeding to also create demo clubs/announcements/events/a sample suggestion — useful for a fresh local dev database. Leave it unset (the default) for a clean seed with real officer accounts and no placeholder content — this is what production should always use.

## How permissions work (server-side)

Every protected API route runs through `lib/auth.ts` helpers:

- `canPostAudience(session, audience)` — schoolwide/class posts
- `canPostToClub(session, clubId)` — club posts
- `canManageTeam(session)` — only `sga_admin`
- `canManageClubs(session)` — only `sga_admin`
- `canRedirectSuggestion(session)` — only `sga_admin`
- `canEditTeamMember(session, memberId)` — `sga_admin` always; `sga_member` only if `teamMemberId === memberId`

A class officer trying to delete a schoolwide announcement gets a 403 even if they hand-craft the request.

## How suggestion routing works

When someone submits an idea they pick a **target**:

| Target | Goes into |
|---|---|
| `sga` (default) | SGA inbox only |
| `27` / `28` / `29` / `30` | That class officer's inbox **AND** SGA inbox |
| `club` | That club's inbox **AND** SGA inbox |

All suggestions remain on the public board regardless of target — the target just determines who has admin access to mark them read / delete / redirect.

SGA admins can **redirect** an `sga`-targeted suggestion to a class or club inbox. After redirect it shows in both inboxes.

## How the audience system works

Every announcement and event has an **audience**: `all` (schoolwide), one of `27`/`28`/`29`/`30` (class), or `club` (with `clubId`).

Logged-in students see posts where audience = `all` OR audience = their class (and all club content via `/clubs/<slug>`). The Announcements/Events pages have a filter: **For me / Schoolwide only / Everything**. Guests see everything.

`middleware.ts` redirects first-time visitors to `/welcome` to pick a class. They can change it any time from the nav chip or footer.

## Configuration

Edit `.env`:

```
DATABASE_URL="postgresql://..."      # Neon-pooled connection string
DIRECT_URL="postgresql://..."        # Neon direct (non-pooled) connection
JWT_SECRET="<32+ char random string>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="poly2026"
```

`ADMIN_USERNAME` / `ADMIN_PASSWORD` only seeds the site-admin account; everyone else is set in `prisma/seed.ts`. Re-run `npm run db:seed` after changing.

`DIRECT_URL` is required for `prisma db push` / migrations on Neon; `DATABASE_URL` should use the pooled connection (`...-pooler.aws.neon.tech`).

### Adding the transparency suite to an existing deploy

The five transparency models (`Meeting`, `ActionItem`, `Initiative`, `InitiativeUpdate`, `InitiativeSuggestion`, `BudgetPeriod`, `BudgetLine`, `VoiceSubmission`, `VoiceVote`) are additive — no existing tables are modified. Push the schema once after pulling:

```bash
npx prisma db push
```

No new environment variables are required.

## Deploying to a real website

### Recommended: Vercel + Neon Postgres (free tier, ~15 min)

**1. Swap SQLite → Postgres**

In `prisma/schema.prisma`, change the datasource block:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**2. Create a Postgres database**

- Sign up at [neon.tech](https://neon.tech) (free, no card needed)
- Create a project → copy the connection string (`postgres://...`)

**3. Push to GitHub**

```bash
git init
git add .
git commit -m "initial commit"
gh repo create poly-sga --public --push  # or use github.com/new
```

**4. Deploy on Vercel**

- Go to [vercel.com/new](https://vercel.com/new) → import your GitHub repo
- Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string |
| `JWT_SECRET` | a random 32+ character string (generate with `openssl rand -base64 32`) |
| `ADMIN_USERNAME` | your admin username |
| `ADMIN_PASSWORD` | your admin password |

- Set **Framework Preset** to Next.js → click **Deploy**

**5. Seed the production database**

After the first deploy, run the seed against your Neon DB locally:

```bash
DATABASE_URL="postgres://..." npm run db:seed
```

Or add a one-shot Vercel Build Command: `prisma db push && tsx prisma/seed.ts` (only for first deploy; remove after).

**6. Set up a custom domain (optional)**

In your Vercel project → **Settings → Domains** → add your domain (e.g. `polysga.org`). Vercel gives you free SSL automatically.

---

### Keeping it updated

Whenever you push code to `main`, Vercel redeploys automatically. Schema changes need a `prisma db push` run (add it to your build command or run it manually against the production `DATABASE_URL`).

---

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Neon)
- `jose` (JWT) + `bcryptjs` (password hashing)
- `lucide-react` icons

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run setup` — db push + seed (one-shot; wipes and recreates all accounts/content — see [Officer logins](#officer-logins))
- `npm run db:seed` — re-run seed
- `npm run db:studio` — open Prisma Studio to inspect data

## Project structure

```
app/
  welcome/             # first-visit grade picker (with officer login link)
  page.tsx             # home (filtered by grade)
  announcements/       # public announcements list
  events/              # upcoming + past events
  clubs/               # public clubs index
    [slug]/            # per-club detail page
  team/                # team roster with photos
  suggestions/         # public idea board with target-routing form
  admin/
    login/             # officer login (username + password)
    profile/           # edit own login + own team profile
    page.tsx           # dashboard (scope-aware) + transparency launcher
    dashboard.tsx
    transparency/      # hub for the four transparency admin pages
    minutes/           # CRUD for meetings + action items
    initiatives/       # board + suggestions review queue
    budget/            # periods + line items
    voice/             # respond, status, visibility, delete
  minutes/             # public meeting record
  initiatives/         # public kanban + student suggestion form
  budget/              # public budget page with charts
  accountability/      # aggregated action items
  voice/               # public voice submissions feed
    [ticket]/          # public ticket status page
  api/
    auth/login         # POST { username, password }
    auth/logout
    auth/profile       # GET current; PATCH username/name/password
    grade/             # set/clear grade cookie
    announcements/     # CRUD (scope-checked)
    events/            # CRUD (scope-checked)
    clubs/             # CRUD (sga_admin only)
      [id]/
    team/              # POST + GET (sga_admin)
      [id]/            # PATCH (self or sga_admin) + DELETE (sga_admin)
    suggestions/       # GET/POST/PATCH/DELETE
      vote/            # toggle upvote
      redirect/        # forward to another inbox (sga_admin only)
    minutes/           # CRUD for Meeting (SGA roles)
    action-items/      # CRUD for ActionItem (status drops are quick-update)
    initiatives/       # CRUD for Initiative
      updates/         # post / delete InitiativeUpdate entries
    initiative-suggestions/  # public POST; SGA-only review/promote
    budget/            # CRUD for BudgetPeriod
      lines/           # CRUD for BudgetLine
    voice/             # POST is public; PATCH/DELETE are SGA
      vote/            # public upvote toggle (one per browser cookie)
      ticket/          # public ticket lookup by code
components/
  nav.tsx, footer.tsx, shell.tsx
lib/
  auth.ts              # JWT session, role-based permission helpers
  db.ts                # Prisma singleton
  grade.ts             # grade + voter cookies
  utils.ts             # cn(), date formatters
prisma/
  schema.prisma
  seed.ts              # admins (with usernames) + clubs + content
middleware.ts          # first-visit /welcome redirect
```
