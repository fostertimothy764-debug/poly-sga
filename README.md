# Poly SGA — Baltimore Polytechnic Institute

Student Government Association website for Baltimore Polytechnic Institute. Next.js + Prisma + SQLite + Tailwind.

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
- **Auth** — JWT cookie sessions, bcrypt-hashed passwords, server-side scope enforcement on every API route.
- **Minimalist UI** — Inter + Fraunces typography, orange/navy Poly accents, subtle motion, mobile-first.

## Quick start

```bash
cd sga-website
npm install
npm run setup     # creates SQLite DB and seeds demo data
npm run dev
```

Open http://localhost:3000.

> Schema changed since v1 — if you ran the older seed, delete `prisma/dev.db*` first or run `npm run setup` (which calls `prisma db push`, which will reset).

## Officer logins

| Username | Password | Role | Can do |
|---|---|---|---|
| `admin` | `poly2026` | SGA Admin | Everything (site admin / "you") |
| `maya` | `maya2026` | SGA Admin (President) | Everything + edit Maya's profile |
| `jordan` | `jordan2026` | SGA Admin (Chief of Staff) | Everything + edit Jordan's profile |
| `aisha` | `aisha2026` | SGA Officer (VP) | Post schoolwide, edit Aisha's profile only |
| `devon` | `devon2026` | SGA Officer (Treasurer) | Post schoolwide, edit own profile only |
| `luke` | `luke2026` | SGA Officer (Secretary) | Post schoolwide, edit own profile only |
| `sofia` | `sofia2026` | SGA Officer (Comms) | Post schoolwide, edit own profile only |
| `class27` | `class27` | Class Officer | Post to Class of 2027 only |
| `class28` | `class28` | Class Officer | Post to Class of 2028 only |
| `class29` | `class29` | Class Officer | Post to Class of 2029 only |
| `class30` | `class30` | Class Officer | Post to Class of 2030 only |
| `robotics_admin` | `robotics` | Club Officer | Post to Robotics only |
| `debate_admin` | `debate` | Club Officer | Post to Debate only |

Each user can change their username and password from `/admin/profile` after signing in.

The site-admin username/password come from `.env`. Other accounts live in [`prisma/seed.ts`](prisma/seed.ts).

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
DATABASE_URL="file:./dev.db"
JWT_SECRET="<32+ char random string>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="poly2026"
```

`ADMIN_USERNAME` / `ADMIN_PASSWORD` only seeds the site-admin account; everyone else is set in `prisma/seed.ts`. Re-run `npm run db:seed` after changing.

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
- Prisma + SQLite (swap to Postgres in `prisma/schema.prisma` for production)
- `jose` (JWT) + `bcryptjs` (password hashing)
- `lucide-react` icons

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run setup` — db push + seed (one-shot; resets demo content)
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
    page.tsx           # dashboard (scope-aware)
    dashboard.tsx
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
