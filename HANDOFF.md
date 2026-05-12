# Poly SGA — Developer Handoff

> **Purpose**: Drop this file into a new Claude Code session to get full context on the codebase, what has been built, and what comes next.

---

## Project Overview

**Poly SGA** is the student-government website for Baltimore Polytechnic Institute. It lets students browse announcements, events, clubs, and team bios; upvote idea-board suggestions; and receive class-targeted content. Officers log in to post, edit, and manage everything.

- **Live URL**: https://poly-sga2.vercel.app
- **Repo**: https://github.com/fostertimothy764-debug/poly-sga
- **Local path**: `/Users/tjs/sga-website`
- **Hosting**: Vercel (auto-deploys from `main`)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 |
| Auth | JWT in httpOnly cookie (`poly_sga_session`) via `jose` |
| Icons | Lucide React |
| Fonts | Inter (sans) + Fraunces (display/serif) from Google Fonts |
| Deploy | Vercel |

### Key env vars (`.env`)
```
DATABASE_URL=       # Neon pooler URL
DIRECT_URL=         # Neon direct URL (for Prisma migrations)
JWT_SECRET=         # 32+ char secret for officer session JWTs
```

---

## Repository Structure

```
sga-website/
├── app/
│   ├── page.tsx                    # Home page (server component)
│   ├── layout.tsx                  # Root layout — loads fonts, wraps in Shell
│   ├── globals.css                 # Tailwind base + component classes
│   ├── announcements/
│   │   ├── page.tsx                # Server: fetches + renders announcements
│   │   ├── announcement-list.tsx   # Client: renders list, inline admin edit
│   │   ├── filter.tsx              # Audience filter tabs (Mine/All/School)
│   │   └── loading.tsx             # ★ Skeleton shown during navigation
│   ├── events/
│   │   ├── page.tsx                # Server: upcoming + past + club events
│   │   ├── event-list.tsx          # Client: renders list, inline admin edit
│   │   └── loading.tsx             # ★ Skeleton shown during navigation
│   ├── suggestions/
│   │   ├── page.tsx                # Server: fetches suggestions + clubs
│   │   ├── client.tsx              # Client: vote, filter, submit modal
│   │   └── loading.tsx             # ★ Skeleton shown during navigation
│   ├── clubs/
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   └── request-form.tsx
│   ├── team/page.tsx
│   ├── links/page.tsx
│   ├── photos/
│   │   ├── page.tsx
│   │   └── gallery.tsx
│   ├── scoop/
│   │   ├── page.tsx
│   │   └── scoop-list.tsx
│   ├── welcome/
│   │   ├── page.tsx
│   │   └── client.tsx              # Grade picker (class cookie flow)
│   ├── admin/
│   │   ├── page.tsx                # Officer dashboard
│   │   ├── dashboard.tsx           # Client dashboard component
│   │   ├── login/page.tsx
│   │   └── profile/
│   └── api/
│       ├── announcements/route.ts  # GET (list) / POST / PATCH / DELETE
│       ├── events/route.ts
│       ├── suggestions/
│       │   ├── route.ts            # GET / POST
│       │   ├── vote/route.ts       # POST (toggle vote)
│       │   └── redirect/route.ts
│       ├── clubs/route.ts + [id]/route.ts
│       ├── team/route.ts + [id]/route.ts
│       ├── grade/route.ts          # POST (set cookie) / DELETE (clear)
│       ├── auth/login + logout + profile
│       ├── photos/route.ts
│       ├── newsletter/route.ts
│       ├── links/route.ts
│       ├── mailing-list/route.ts
│       └── admin/accounts/route.ts
├── components/
│   ├── shell.tsx                   # Wraps nav + footer + bottom tab bar
│   ├── nav.tsx                     # Top navigation (client component)
│   ├── bottom-tab-bar.tsx          # ★ Mobile 5-tab bar (new)
│   ├── footer.tsx
│   ├── admin-mode-banner.tsx
│   ├── mailing-list-form.tsx
│   ├── photo-upload.tsx
│   └── toast.tsx
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── auth.ts                     # JWT session helpers
│   ├── grade.ts                    # Grade cookie helpers + GRADES constant
│   └── utils.ts                    # cn(), formatDate, formatTime, relativeTime
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                   # Redirect to /welcome if no grade cookie
└── tailwind.config.ts
```

★ = added in Phase 1

---

## Data Models (Prisma)

```
Admin           – officer accounts; roles: sga_admin | sga_member | class | club
Club            – slug, name, description, meetingTime, location, photoUrl
Announcement    – title, body, pinned, audience, clubId, authorName, createdAt
Event           – title, description, location, audience, clubId, startsAt, endsAt
TeamMember      – name, role, grade, bio, photoUrl, order
Suggestion      – body, category, target, clubId, votes, private, createdAt
SuggestionVote  – suggestionId + voterId (unique pair)
Photo           – title, caption, url (base64 or https), audience, eventLabel
Newsletter      – title, issueLabel, description, body, externalUrl, coverUrl
ResourceLink    – title, url, description, category, audience, pinned
MailingList     – email, name
ClubRequest     – clubName, description, contactName, contactInfo, status
```

**Audience values** used across Announcement, Event, ResourceLink:
`"all"` | `"27"` | `"28"` | `"29"` | `"30"` | `"club"`

**Suggestion target values**: `"sga"` | `"27"` | `"28"` | `"29"` | `"30"` | `"club"`

---

## Identity & Auth System

### Student (anonymous)
- On first visit, middleware redirects to `/welcome`.
- User picks a class year → `POST /api/grade` sets `poly_grade` cookie (1-year, lax).
- Grade values: `"27" | "28" | "29" | "30" | "guest"`.
- Voter identity: `poly_voter` cookie (UUID, 1-year) used to deduplicate votes.
- No login, no PII stored.

### Officers
- `POST /api/auth/login` → sets `poly_sga_session` JWT cookie (1-year, httpOnly, HS256).
- Session payload: `{ adminId, username, name, role, isSiteAdmin, classYear, clubId, teamMemberId }`.
- `lib/auth.ts` → `getSession()` reads + verifies the cookie server-side.
- Role matrix:

| Role | Can post to |
|---|---|
| `sga_admin` | Everything |
| `sga_member` | Schoolwide + own team profile |
| `class` | Own class year only |
| `club` | Own club only |

---

## Design Tokens

All tokens live in `tailwind.config.ts` and `globals.css`.

### Colors
```
poly-orange:     #f26522   (primary CTA, active states)
poly-orangeDark: #d44e0f   (hover on orange)
poly-orangeSoft: #FFE9DC   (tinted bg for orange pills/empty states) ★
poly-navy:       #0a2342   (primary dark, hero, officer view)
poly-navyDark:   #061629   (hover on navy)
poly-navySoft:   #E6EAF2   (tinted bg for navy pills) ★
poly-green:      #3E8E5A   (success / "in progress" status) ★
poly-amber:      #C68A1E   (warning / "under review" status) ★

ink-50:  #f8f8f7   (page background)
ink-100: #eeede9
ink-200: #d9d6cf   (borders, hairlines)
ink-300–900: warm gray scale

class-27: #E15A1F  (Seniors) ★
class-28: #5D6FB8  (Juniors) ★
class-29: #C68A1E  (Sophomores) ★
class-30: #7BB66B  (Freshmen) ★
```
★ = added in Phase 1

### Typography
```
font-sans:    Inter (CSS var --font-sans)
font-display: Fraunces (CSS var --font-display) — used for h1–h3, large numbers
```

### Component Utility Classes (globals.css)
```css
.container-page   max-w-5xl, centered, px-6 sm:px-8
.btn              base button (rounded-full, focus ring)
.btn-primary      navy fill
.btn-accent       orange fill
.btn-ghost        text only with hover bg
.card             rounded-2xl, border-ink-200, bg-white, p-6
.card-hover       hover border + subtle shadow
.input            rounded-xl form field
.label            ALL CAPS tracking-wider field label
.chip             rounded-full tag/badge
.h-display        font-display font-light tracking-tight
```

---

## Routing & Pages

| Route | Type | Description |
|---|---|---|
| `/` | Server | Home: hero, digest card, quick nav, announcements, events |
| `/welcome` | Client | Grade picker (redirected here if no cookie) |
| `/announcements` | Server+Client | Full announcement list with audience filter |
| `/events` | Server+Client | Upcoming, club, and past events |
| `/suggestions` | Server+Client | Idea board: vote, filter, submit |
| `/clubs` | Server | Club index |
| `/clubs/[slug]` | Server | Club detail |
| `/team` | Server | Officer team grid |
| `/links` | Server | Resource links |
| `/photos` | Server+Client | Photo gallery |
| `/scoop` | Server+Client | Newsletter issues |
| `/admin` | Server+Client | Officer dashboard (protected by session) |
| `/admin/login` | Client | Officer login form |
| `/admin/profile` | Client | Officer profile edit |

**All pages** are `force-dynamic` (no static caching) to always reflect DB state.

---

## What Was Implemented: Phase 1 (commit `32730ab`)

All five ideas from the `design_handoff_poly_sga/` bundle. The design spec lives at `/tmp/website_extract/design_handoff_poly_sga/` (extracted from `~/Downloads/website.zip`). The canonical spec file is `ideas.jsx`.

### Idea 01 — "This week for you" digest card (`app/page.tsx`)
- Appears on home when the user has a grade cookie set (not for guests).
- Navy card (`#0E1E3A`) with orange mono eyebrow "THIS WEEK · FOR [CLASS]", a Fraunces summary sentence driven by real counts, and three stat counters.
- Queries added: `newPostsCount` (announcements created in last 7 days), `upcomingCount` (events in next 7 days), `trendingCount` (suggestions with ≥5 votes).
- Summary sentence logic: if events → leads with event count; else if posts → leads with post count; else → placeholder text.
- `classSub(grade)` maps `"28"` → `"Juniors"` etc. via `GRADES` from `lib/grade.ts`.

### Idea 02 — Freshness pills
- **`NEW` badge** (green chip): shown on announcements < 48 h old, hidden when post is also `pinned` (pinned already signals priority).
  - Added to: home page announcement cards (`app/page.tsx`) and announcement list (`app/announcements/announcement-list.tsx`).
  - Each badge includes `<span class="sr-only">` for screen readers.
- **`SOON` badge** (orange-soft chip): shown on events starting within 24 h.
  - Added to: `app/events/event-list.tsx` via `isSoon(startsAt)` helper.

### Idea 03 — Mobile bottom tab bar (`components/bottom-tab-bar.tsx`)
- Fixed 5-tab nav: Home / Events / Ideas / Clubs / Team (Lucide icons).
- Visible only on `< md` breakpoint (`flex md:hidden`).
- Active tab: `text-poly-orange`, thicker stroke (`strokeWidth={2.5}`).
- Uses `usePathname()` for active detection; `/` is exact-match only.
- `aria-current="page"` on active tab for accessibility.
- Wired into `components/shell.tsx` — also adds `pb-16 md:pb-0` to `<main>` so content isn't hidden behind the bar.

### Idea 04 — Illustrated empty states
- All bare `"No items."` divs replaced with: ✦ icon in `poly-orangeSoft` circle + Fraunces headline + body copy + optional CTA button.
- Locations updated:
  - `app/page.tsx` → `RichEmptyState` component (home announcements + events sections)
  - `app/announcements/announcement-list.tsx` → inline empty state
  - `app/events/page.tsx` → inline empty state for upcoming section
  - `app/suggestions/client.tsx` → inline empty state with context-aware copy (filter-active vs. truly empty) and a "Browse all ideas →" reset link

### Idea 05 — Skeleton loaders (loading.tsx)
- Three new `loading.tsx` files — Next.js App Router auto-shows these during navigation (Suspense boundary):
  - `app/announcements/loading.tsx` — card skeletons with chip + title + body rows
  - `app/events/loading.tsx` — date-block + content skeletons in 2-col grid
  - `app/suggestions/loading.tsx` — vote button + idea row skeletons

---

## Patterns & Conventions

### Server vs. Client split
- Pages are **server components** that fetch data and pass it as `initial` props to client components.
- Client components handle interactivity (voting, filtering, inline edit) and receive initial data to avoid layout shift.

### Grade-aware filtering
```ts
const grade = getGrade(); // reads poly_grade cookie server-side
const audienceFilter = grade && grade !== "guest"
  ? { audience: { in: ["all", grade] } }
  : {};
```

### Admin permission check pattern (inline in client components)
```ts
function canEdit(item) {
  if (!admin) return false;
  if (admin.role === "sga_admin" || admin.role === "sga_member") return true;
  if (admin.role === "class") return item.audience === admin.classYear;
  if (admin.role === "club") return item.clubId === admin.clubId;
  return false;
}
```

### Optimistic voting (suggestions/client.tsx)
```ts
async function vote(id: string) {
  // 1. Flip immediately
  setItems(prev => prev.map(i =>
    i.id === id ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i
  ));
  // 2. Confirm from server
  const res = await fetch("/api/suggestions/vote", { method: "POST", ... });
  if (res.ok) {
    const data = await res.json();
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }
}
```

### API route pattern
```ts
// GET: list with optional where clause
// POST: create
// PATCH: update (id in body)
// DELETE: delete (id in query param)
// All officer-mutating routes call getSession() and check role
```

---

## Phase Roadmap (from design spec)

The full spec is in `design_handoff_poly_sga/README.md` and `ideas.jsx`. Implement one phase at a time.

| Phase | Ideas | Status |
|---|---|---|
| **1 — Quick wins** | 01–05: digest card, freshness pills, bottom tab bar, empty states, skeletons | ✅ **Done** |
| **2 — Idea board upgrade** | 10–14: status pills, comments, "my votes" filter, duplicate detection, "wins this month" strip | ⬜ Next |
| **3 — Home + nav** | 06–09: unified "For you" feed, persistent class chip, "what's next?" strip, ⌘K search | ⬜ |
| **4 — Events & clubs** | 15–18: RSVPs, add-to-calendar, richer club cards, club↔event cross-links | ⬜ |
| **5 — Identity + officer tools** | 19–26: per-class hues, two-step welcome, `/me` page, celebrations, ⌘K composer, triage view, audience preview, activity dashboard | ⬜ |
| **6 — Polish** | 27–30: dark mode, focus rings + skip link, share sheets, `@vercel/og` OG images | ⬜ |

### Phase 2 detail (next up)

**Idea 10 — Status labels on ideas**
- Add `status` enum column to `Suggestion`: `new | under_review | in_progress | done | declined`
- Add `statusNote` text column (reason for declined/done)
- Prisma migration: `npx prisma db push`
- Officers can update status via admin dashboard or inline on the idea
- Color-coded pill on public idea card (new=indigo, under_review=amber, in_progress=green, done=green-filled, declined=ink-3)

**Idea 11 — Comments / "me too" threads**
- New table: `IdeaComment { id, suggestionId, body, createdAt, authorClass }`
- Lightweight reply thread per idea, school-name only (no avatars)
- Top comment surfaces below the idea title

**Idea 12 — "My votes" filter**
- Toggle chip on suggestions page
- Filter by `voted: true` in client-side state (already tracked)

**Idea 13 — Duplicate detection**
- While composing, debounce 300 ms then fuzzy-match against open ideas
- Show up to 3 suggestions: "This already exists — upvote instead?"

**Idea 14 — "Wins this month" strip**
- Pinned strip above idea board showing ideas moved to `done` this month

---

## How to Continue in a New Session

1. **Read this file** — you now have full context.
2. **Read the design spec**: `/tmp/website_extract/design_handoff_poly_sga/README.md` and `ideas.jsx` (or re-extract from `~/Downloads/website.zip`).
3. **Start the dev server**: `cd /Users/tjs/sga-website && npm run dev`
4. **Implement the next phase**: "Implement Phase 2 (ideas 10–14) following the patterns in this handoff."

---

## Quick Reference

```bash
# Dev
cd /Users/tjs/sga-website
npm run dev

# DB
npx prisma db push          # push schema changes
npx prisma studio           # GUI
npx prisma db seed          # seed data

# Deploy
git push origin main        # Vercel auto-deploys

# Type check
npx tsc --noEmit
```
