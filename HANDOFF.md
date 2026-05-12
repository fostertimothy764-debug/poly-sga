# Poly SGA — Developer Handoff

> Drop this file into a fresh Claude Code session to land with full context.

---

## What this is

**Poly SGA** is the student-government website for Baltimore Polytechnic Institute. It lets students browse announcements, events, clubs, and team bios; upvote idea-board suggestions; track officer follow-through via a public status system; and read the SGA Scoop newsletter. Officers log in to post, edit, and manage everything.

- **Live**: https://poly-sga2.vercel.app
- **Repo**: https://github.com/fostertimothy764-debug/poly-sga
- **Local**: `/Users/tjs/sga-website`
- **Hosting**: Vercel (auto-deploys from `main`)

The site is **not** a generic LMS portal. The strategic anchor is *legitimacy*: a student who lands on the site should leave with the sense that SGA is a real organization doing real work. The aesthetic is a small-press neighborhood paper (think Eater city pages), not a SaaS landing.

---

## Strategic + visual context

Two root-level docs carry the strategy and visual system. **Read these before designing anything.**

- **`PRODUCT.md`** — register (`product`), users, anti-references (LMS portals, SaaS landings, kids' apps), 5 design principles. Strategic.
- **`DESIGN.md`** — Stitch-format frontmatter (colors, typography, components) + 6-section body (Overview, Colors, Typography, Elevation, Components, Do's and Don'ts). North Star: *"The Neighborhood Paper."* Visual.

Both are enforced by the `impeccable` skill — running `/impeccable critique` or `/impeccable audit` reads from these files.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, server components) |
| Styling | Tailwind CSS v3 |
| Database | PostgreSQL via Neon (serverless, free tier — auto-suspends) |
| ORM | Prisma 5 |
| Auth | JWT in httpOnly cookie (`poly_sga_session`) via `jose` |
| Icons | Lucide React |
| Fonts | **Plus Jakarta Sans** (body) + **Fraunces** (display/serif) — both Google Fonts |
| Deploy | Vercel |

### `.env`

```
DATABASE_URL=       # Neon pooler URL (used by app at runtime)
DIRECT_URL=         # Neon direct URL (used by Prisma migrations)
JWT_SECRET=         # 32+ char secret for officer session JWTs
ADMIN_USERNAME=     # initial sga_admin seed username
ADMIN_PASSWORD=     # initial sga_admin seed password
```

---

## Project structure

```
sga-website/
├── PRODUCT.md                       # ★ strategic doc
├── DESIGN.md                        # ★ visual system
├── HANDOFF.md                       # this file
├── app/
│   ├── page.tsx                     # Home — newspaper masthead, lead, secondary stack
│   ├── not-found.tsx                # ★ custom 404, editorial voice
│   ├── about/page.tsx               # ★ colophon
│   ├── layout.tsx                   # loads fonts, wraps in Shell
│   ├── globals.css                  # Tailwind base + component classes
│   ├── announcements/
│   │   ├── page.tsx
│   │   ├── announcement-list.tsx    # inline admin edit, pull-quote rendering
│   │   ├── filter.tsx               # audience filter tabs
│   │   └── loading.tsx
│   ├── events/                      # page, event-list, loading
│   ├── suggestions/                 # page (incl. wins query), client (idea board, status pills)
│   ├── clubs/                       # page, [slug]/page, request-form
│   ├── team/
│   │   ├── page.tsx                 # grid of clickable officer cards
│   │   └── [id]/
│   │       ├── page.tsx             # ★ officer profile (server)
│   │       └── contact-strip.tsx    # ★ tap-to-copy email/Instagram
│   ├── links/page.tsx
│   ├── photos/                      # page, gallery
│   ├── scoop/                       # page, scoop-list
│   ├── welcome/                     # page, client (grade picker)
│   ├── admin/
│   │   ├── page.tsx                 # protected dashboard wrapper
│   │   ├── dashboard.tsx            # ★ big — all admin tabs in one file
│   │   ├── login/page.tsx
│   │   └── profile/page.tsx + client.tsx
│   └── api/
│       ├── announcements/route.ts   # GET / POST / PATCH / DELETE (now accepts leadImage)
│       ├── events/route.ts
│       ├── suggestions/
│       │   ├── route.ts             # GET / POST / PATCH(read) / DELETE
│       │   ├── vote/route.ts
│       │   ├── redirect/route.ts    # sga_admin only
│       │   └── status/route.ts      # ★ POST — set status with role-based perms
│       ├── clubs/route.ts + [id]/route.ts
│       ├── team/route.ts + [id]/route.ts  # accept new profile fields
│       ├── grade/route.ts           # set/clear class cookie
│       ├── auth/login + logout + profile
│       ├── photos/route.ts
│       ├── newsletter/route.ts
│       ├── links/route.ts
│       ├── mailing-list/route.ts
│       └── admin/accounts/route.ts
├── components/
│   ├── shell.tsx                    # wraps nav + footer + bottom tab bar
│   ├── nav.tsx                      # top nav
│   ├── bottom-tab-bar.tsx           # mobile 5-tab bar
│   ├── footer.tsx                   # incl. /about link
│   ├── admin-mode-banner.tsx
│   ├── mailing-list-form.tsx
│   ├── photo-upload.tsx             # client-side compress to base64
│   ├── toast.tsx
│   ├── confirm-dialog.tsx           # ★ useConfirm() hook + portal dialog
│   ├── status-pill.tsx              # ★ 7-status renderer, reused everywhere
│   └── rich-body.tsx                # ★ pull-quote rendering (`> ` syntax)
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── auth.ts                      # JWT helpers + canSetSuggestionStatus + SUGGESTION_STATUSES
│   ├── grade.ts                     # cookie helpers + GRADES + getVoterId
│   └── utils.ts                     # cn, formatDate, relativeTime, readingTime, classAccentStyle
├── prisma/
│   ├── schema.prisma                # ★ updated: status fields, profile fields, leadImage
│   ├── migrations/
│   │   └── manual-life-pass.sql     # ★ idempotent SQL — apply if `prisma db push` fails
│   └── seed.ts
├── middleware.ts                    # redirect to /welcome if no grade cookie
└── tailwind.config.ts               # palette: poly-{orange,navy,green,amber,...} + class-{27..30}
```

★ = added or substantially rewritten in the editorial redesign.

---

## Data models (Prisma)

```prisma
Admin              # role: sga_admin | sga_member | class | club; teamMemberId FK
Club               # slug, name, description, meetingTime, location, photoUrl
Announcement       # title, body, pinned, audience, clubId, authorName, leadImage ★
Event              # title, description, location, audience, clubId, startsAt, endsAt
TeamMember         # name, role, grade, bio, photoUrl, order
                   # + pronouns, askMeAbout, schoolEmail, instagram ★
Suggestion         # body, category, target, clubId, contact, votes, private
                   # + status ★, statusLabel ★, statusNote ★,
                   #   statusUpdatedById ★, statusUpdatedByName ★, statusUpdatedAt ★
SuggestionVote     # (suggestionId, voterId) unique
Photo              # title, caption, url, audience, eventLabel
Newsletter        ("SGA Scoop")  # title, issueLabel, body, externalUrl, coverUrl, publishedAt
ResourceLink       # title, url, description, category, audience, pinned
MailingList        # email, name
ClubRequest        # public form on /clubs (not a club-creation form)
```

**Audience** (Announcement, Event, ResourceLink, Photo): `"all" | "27" | "28" | "29" | "30" | "club"` — displayed in chips as `Schoolwide / Class of 20XX / Club`. Always use "Schoolwide," not "Everyone."

**Suggestion target**: `"sga" | "27" | "28" | "29" | "30" | "club"` — who reads the idea's inbox.

**Suggestion status** (★): `"new" | "under_review" | "on_the_agenda" | "in_progress" | "done" | "declined" | "custom"` — see `lib/auth.ts:SUGGESTION_STATUSES`. `custom` renders `statusLabel` as a free-text pill.

---

## Identity & auth

### Student (anonymous)
- First visit → middleware redirects to `/welcome` → student picks class → `POST /api/grade` sets `poly_grade` cookie (1y, lax).
- Grade values: `"27" | "28" | "29" | "30" | "guest"`.
- Voter identity: `poly_voter` cookie (UUID, 1y) deduplicates votes.
- No login, no PII stored.

### Officers
- `POST /api/auth/login` → sets `poly_sga_session` JWT cookie (1y, httpOnly, HS256).
- Session payload: `{ adminId, username, name, role, isSiteAdmin, classYear, clubId, teamMemberId }`.
- `lib/auth.ts:getSession()` reads + verifies the cookie server-side.
- Role matrix:

| Role | Can post to | Can update suggestion status on |
|---|---|---|
| `sga_admin` | Everything | Any idea |
| `sga_member` | Schoolwide + class years + own team profile | Any idea |
| `class` | Own class year only | Ideas targeted at own class year |
| `club` | Own club only | Ideas targeted at own club |

Permission helpers in `lib/auth.ts`: `isSgaAdmin`, `isSga`, `canManageTeam`, `canEditTeamMember`, `canPostAudience`, `canPostToClub`, `canSeeInbox`, `canRedirectSuggestion`, `canSetSuggestionStatus`.

---

## Design tokens

All tokens live in `tailwind.config.ts` + `DESIGN.md`. **Don't add new tokens without updating DESIGN.md.**

### Colors

```
# Signal — used sparingly (≤10% per screen, "The One Voice Rule")
poly-orange      #f26522   primary CTA, active nav, NEW badge
poly-orangeDark  #d44e0f   orange hover/destructive accent
poly-orangeSoft  #FFE9DC   tinted background for SOON / empty-state circles

# Ground — authority
poly-navy        #0a2342   digest card, primary button
poly-navyDark    #061629   navy hover
poly-navySoft    #E6EAF2   tinted background for schoolwide chips

# Status — for status pills, never decorative
poly-green       #3E8E5A   "Done", success
poly-amber       #C68A1E   "Under review", warnings

# Warm neutrals — never #000 / #fff in body or chrome
ink-50           #f8f8f7   page background (canonical)
ink-100          #eeede9
ink-200          #d9d6cf   hairline borders, dividers
ink-300–900      warm gray scale
white            #ffffff   card surfaces only (not page bg)

# Class-year identity — only on viewer's own content, never paints chrome
class-27         #E15A1F   Seniors
class-28         #5D6FB8   Juniors
class-29         #C68A1E   Sophomores
class-30         #7BB66B   Freshmen
```

### Typography

```
font-sans        Plus Jakarta Sans, system-ui, sans-serif   body
font-display     Fraunces (variable, opsz), Georgia, serif  headlines + ledes
```

Hierarchy: Display (Fraunces 300, clamp 2–3.75rem) → Headline (Fraunces 400) → Title (Jakarta 600 1.125rem) → Body (Jakarta 400 1rem, max 65ch) → Label (Jakarta 600 0.75rem uppercase tracked).

### Component utilities (`globals.css`)

```css
.container-page   max-w-5xl, centered, px-6 sm:px-8
.btn / .btn-primary / .btn-accent / .btn-ghost
.card / .card-hover
.input
.label            uppercase tracking-wider field label
.chip             rounded-full tag/badge
.h-display        font-display font-light tracking-tight
.rule-hair / .rule-double  hairline + newspaper double-rule
```

### Absolute bans (enforced by `/impeccable` detector)

- No `.gradient-text` (`background-clip: text` with gradient).
- No `blur-3xl` / `blur-2xl` decorative blobs.
- No `backdrop-blur` (was in nav, bottom-tab-bar, modals — all removed).
- No side-stripe borders (`border-left` > 1px as a colored accent).
- No `from-black/*` overlays (use `from-poly-navyDark/*`).
- No off-palette Tailwind defaults (`amber-50`, `sky-50`, `violet-50`, `red-500`, etc.). Use palette tokens.
- No Title-Cased headings (sentence-case only, except `.label`).
- No exclamation marks in chrome.
- No "Everyone" — audience chips read "Schoolwide."

`npx impeccable --json --fast app components` should return `[]`. Run after any visual change.

---

## Signature components

### `<StatusPill>` (`components/status-pill.tsx`)
Single renderer for idea statuses. 7 values, 7 color tones. Used on:
- Public `/suggestions` row (skipped when status === "new")
- Admin dashboard SuggestionRow
- Wins strip on `/suggestions`

```tsx
<StatusPill status="done" statusLabel={null} />
```

### `<RichBody>` (`components/rich-body.tsx`)
Renders announcement bodies with a thin slice of editorial structure. Paragraphs split on blank lines. Any paragraph starting with `> ` renders as a **Fraunces italic pull-quote** with a hairline left rule. No markdown library — the surface is intentionally tiny.

### `<ConfirmDialog>` + `useConfirm()` (`components/confirm-dialog.tsx`)
Portal-mounted styled dialog. Replaces `window.confirm()` across delete flows. Esc to cancel, Enter to confirm. Destructive variant uses `poly-orangeDark` (never red — red isn't in the palette).

```tsx
const { confirm, dialog } = useConfirm();
const ok = await confirm({ title: "Delete this?", confirmLabel: "Delete" });
```

### `<ContactStrip>` (`app/team/[id]/contact-strip.tsx`)
Tap-to-copy email + Instagram on the officer profile. Confirms with `✓ Copied` in `poly-green` for 1.8s. Underlying mailto/instagram links still work as fallback.

### Wins strip (`/suggestions`)
Server-fetched at the top of the page: `Suggestion.findMany({ status: "done", statusUpdatedAt: { gte: 30daysAgo }})`. Renders a 3-up grid attributed to the shipping officer. **The receipt that SGA does real work.**

### Activity ribbon (`/`)
Thin server-rendered line below the masthead: top idea this week + relative time of the most recent announcement. Only shown for users with a grade cookie set. No polling.

### Issue masthead (`/`)
Double-rule divider, `Vol. X · Issue No. Y` (X = school years since 2023; Y = total announcement count), italic dateline. Reads as a publication, not an app.

### Class-year accent (`lib/utils.ts:classAccentStyle`)
2px left-border in the viewer's class hex color, only on content where `audience === viewerGrade`. Never paints chrome, never on schoolwide content. Applied on home secondary stack, events sidebar, announcement-list, event-list.

---

## Routes

| Route | Type | Notes |
|---|---|---|
| `/` | Server | Masthead, activity ribbon, digest, lead article w/ drop cap + reading time, secondary stack, tail strip |
| `/welcome` | Client | Grade picker, redirected here if no cookie |
| `/announcements` | Server+Client | Editorial header, filter tabs, list with pull-quote rendering + reading time |
| `/events` | Server+Client | Upcoming / Club / Recently sections |
| `/suggestions` | Server+Client | Wins strip → filters → list with status pills + notes |
| `/clubs` + `/clubs/[slug]` | Server | Index + detail |
| `/team` | Server | Clickable officer cards with "Ask me about" pull-quote |
| `/team/[id]` | Server+Client | ★ officer profile with bio, contact strip |
| `/links` | Server+Client | Resource links by category |
| `/photos` | Server+Client | Gallery |
| `/scoop` | Server+Client | Newsletter issues |
| `/about` | Server | ★ colophon |
| `/admin` | Server+Client | Officer dashboard (protected) |
| `/admin/login` | Client | Officer login |
| `/admin/profile` | Server+Client | Self-edit profile (incl. pronouns, askMeAbout, contact) |
| `*` (404) | Server | ★ custom not-found, masthead voice |

All pages `force-dynamic` (no static caching).

---

## Working with the data

### Apply pending schema migration (one-time)

The editorial redesign added new columns to `Announcement`, `TeamMember`, and `Suggestion`. The Prisma client is regenerated; the DB columns may need to be applied if the previous session couldn't reach Neon's direct endpoint. Run **one** of:

```bash
npx prisma db push                     # uses DIRECT_URL
```

Or paste `prisma/migrations/manual-life-pass.sql` into the Neon SQL editor (it's idempotent — `ADD COLUMN IF NOT EXISTS`).

### When Neon goes idle

Free-tier Neon compute suspends after ~5 minutes idle. Symptoms: `P1001 Can't reach database server` + 500 errors on any Prisma route. Fix: open the Neon console SQL editor and run `SELECT 1;` to wake the compute. Auto-resume sometimes takes >5s, which exceeds Prisma's default `connect_timeout` — append `&connect_timeout=30` to both URLs in `.env` for slack.

### Local dev

```bash
cd /Users/tjs/sga-website
npm run dev                            # http://localhost:3000
```

Middleware redirects unset-grade visitors to `/welcome`, so test with `document.cookie = "poly_grade=28"` in DevTools to see the home for a Junior.

### Auth check

```bash
npx prisma studio                      # GUI; verify Admin table has sga_admin user
```

If you need to seed: `npx prisma db seed` (reads `prisma/seed.ts`).

---

## Recent work — what shipped in the editorial redesign

Commit `4a4f8d9` (editorial redesign) + `5447db2` (mobile admin button fix).

**Strategic anchors written:** `PRODUCT.md` + `DESIGN.md`.

**Home page rebuilt as a newspaper:**
- Issue masthead with `Vol. X · Issue No. Y` + italic dateline.
- Activity ribbon (top idea this week, last update relative time).
- Lead article with drop cap on the dek, byline + reading time.
- Secondary 3-up stack with class-year left-border accent.
- Real-photo lead when `Announcement.leadImage` is set.
- Tail strip with one CTA.

**Officer profiles:** `/team/[id]` with photo, pronouns, "Ask me about" lede in Fraunces, full bio, tap-to-copy email + Instagram. Cards on `/team` show the askMeAbout sentence as a pull-quote.

**Idea status system:** 7 statuses (`new / under_review / on_the_agenda / in_progress / done / declined / custom`) with role-based permissions. Officers update from admin dashboard inbox; public board renders pills + bylined status notes. Wins strip on `/suggestions` lists ideas shipped in last 30 days.

**Decoration purge + color discipline:** All `gradient-text`, `blur-3xl`, `backdrop-blur`, sparkles, hero-metric stat tiles, off-palette `amber/sky/violet/red/black` tokens removed. Detector now returns 0 findings.

**Mobile fixes:** Admin edit/delete buttons bumped to 40px on mobile (was 32px, under WCAG min), z-10 + shadow, chip rows reserve `pr-24` so chips don't steal taps.

**Editorial touches:** Pull-quote rendering (`> ` syntax), reading time on announcements, custom 404, colophon page (`/about`), confirm dialog component, sentence-cased copy throughout.

**Font swap:** Inter → Plus Jakarta Sans (detector flagged Inter as overused). Pairs with Fraunces.

---

## Patterns + conventions

### Server vs. client split
Pages are **server components** that fetch and render shells. Client components handle interactivity (voting, editing, status updates) and receive initial data to avoid layout shift.

### Grade-aware filtering
```ts
const grade = getGrade(); // poly_grade cookie
const audienceFilter =
  grade && grade !== "guest" ? { audience: { in: ["all", grade] } } : {};
```

### Admin permission inline check
```ts
function canEdit(item) {
  if (!admin) return false;
  if (admin.role === "sga_admin" || admin.role === "sga_member") return true;
  if (admin.role === "class") return item.audience === admin.classYear;
  if (admin.role === "club") return item.clubId === admin.clubId;
  return false;
}
```

### Optimistic voting (suggestions)
```ts
async function vote(id) {
  setItems((prev) => prev.map((i) => i.id === id ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i));
  const res = await fetch("/api/suggestions/vote", { method: "POST", body: JSON.stringify({ id }) });
  if (res.ok) {
    const data = await res.json();
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...data } : i));
  }
}
```

### API route pattern
- GET — list / filter (no auth unless inbox-style)
- POST — create (officer auth)
- PATCH — update (id in body, officer auth + role check)
- DELETE — delete (?id= query param, officer auth)
- Mutating routes always call `getSession()` and check role *before* touching Prisma.

### Class accent
```ts
<article style={classAccentStyle(item.audience, viewerGrade)}>
```
`classAccentStyle` returns `undefined` when no accent applies — safe to spread.

---

## Common tasks

### Add a new audience-filtered page
1. Page component fetches with `audienceFilter` from `getGrade()`.
2. Render header with editorial pattern: `<header className="mb-10 pb-8 border-b border-ink-200 max-w-2xl">` + label eyebrow + Fraunces H1 + dek.
3. Pass `viewerGrade={grade && grade !== "guest" ? grade : null}` to the client component.
4. Apply `style={classAccentStyle(item.audience, viewerGrade)}` on each card.

### Add a new status to ideas
1. Add to `SUGGESTION_STATUSES` in `lib/auth.ts`.
2. Add to `STATUS_OPTIONS` + `STATUS_CLASSES` in `components/status-pill.tsx`.
3. Update DESIGN.md if you want it canonical.

### Verify
```bash
npx tsc --noEmit                       # type check
npx impeccable --json --fast app components   # 0 findings target
```

---

## Pending roadmap

The original Phase 2 (idea status) is done. What's left from the original `design_handoff_poly_sga/ideas.jsx` spec:

| Phase | Ideas | Status |
|---|---|---|
| **3 — Home + nav** | Persistent class chip in nav, ⌘K search, unified "For you" feed | Partial — class chip exists, ⌘K not started |
| **4 — Events + clubs** | RSVPs, add-to-calendar, richer club cards, club↔event cross-links | Not started |
| **5 — Identity + officer tools** | `/me` page (student-side), celebrations, ⌘K composer, audience preview, activity dashboard | Not started |
| **6 — Polish** | Dark mode, focus rings + skip link, share sheets, `@vercel/og` OG images | Not started |

The most strategic next move is probably **share sheets + OG images** (Phase 6) — students share announcements in GroupMe/iMessage, and right now those previews are unstyled. Cheap win, high signal.

---

## How to continue in a new session

1. **Read PRODUCT.md and DESIGN.md** — strategic anchors, not optional.
2. **Read this file** for current state.
3. **Run** `npm run dev` and verify the home page renders (Neon may need waking).
4. **Run** `npx impeccable --json --fast app components` — must be `[]`.
5. **Pick a task from "Pending roadmap" above, or take direction from the user.**

When in doubt: editorial pacing, real over decorative, identity stays in its lane, signal-orange ≤10% per screen.

---

## Quick reference

```bash
# Dev
cd /Users/tjs/sga-website
npm run dev

# Database
npx prisma db push                     # apply schema; needs DIRECT_URL reachable
npx prisma generate                    # regenerate client (no DB needed)
npx prisma studio                      # GUI
npx prisma db seed                     # seed data

# Deploy
git push origin main                   # Vercel auto-deploys

# Verify
npx tsc --noEmit                       # type check
npx impeccable --json --fast app components  # design-anti-pattern detector
```

Maintainer: **Timothy Foster** (tim.d.foster.jr@gmail.com).
