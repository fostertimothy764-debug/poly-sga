---
name: Poly SGA
description: Student-government site for Baltimore Polytechnic Institute, in the voice of a neighborhood paper.
colors:
  ink-page: "#f8f8f7"
  ink-surface: "#ffffff"
  ink-rule: "#d9d6cf"
  ink-body: "#1c1b18"
  ink-muted: "#5a554b"
  ink-quiet: "#928c7e"
  signal-orange: "#f26522"
  signal-orange-deep: "#d44e0f"
  signal-orange-soft: "#FFE9DC"
  ground-navy: "#0a2342"
  ground-navy-deep: "#061629"
  ground-navy-soft: "#E6EAF2"
  status-success: "#3E8E5A"
  status-pending: "#C68A1E"
  class-seniors: "#E15A1F"
  class-juniors: "#5D6FB8"
  class-sophomores: "#C68A1E"
  class-freshmen: "#7BB66B"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2rem, 5.5vw, 3.75rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ground-navy}"
    textColor: "{colors.ink-surface}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ground-navy-deep}"
  button-accent:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.ink-surface}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-accent-hover:
    backgroundColor: "{colors.signal-orange-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chip:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Poly SGA

## 1. Overview

**Creative North Star: "The Neighborhood Paper"**

The interface reads like a small-press city magazine published by people who live in the neighborhood — Eater's city pages, the back half of a college weekly, the front page of a thoughtful zine. Headlines are set in a warm display serif. Body copy is short, sentence-cased, and authored by name. Photographs of real students and real events do the work that stock illustration usually fails at. White space is the loudest element on the page.

The system explicitly rejects three families. It does not look like an LMS portal (Schoology, Blackboard) — no dense gray tables, no nested borders, no 2010-era status pills. It does not look like a SaaS landing page — no gradient text, no hero-metric template, no identical three-up feature grids. It does not look like a kids' app — no rounded mascots, no pastel candy palette, no exclamation marks in chrome. Warmth here comes from typography and pacing, not from cartoon affect.

The site treats students as adults reading a publication. Officers appear bylined alongside their posts. Class years are named ("Juniors", "Class of '28") rather than coded ("28"). Density is editorial, not application-shaped: most surfaces breathe, and the home page reads top-to-bottom like a lede with a few features below it.

**Key Characteristics:**
- Display serif (Fraunces) for headlines; humanist sans (Inter) for everything else.
- Warm off-white page (#f8f8f7), warm-tinted neutrals throughout. Never pure white, never pure black.
- One accent (signal-orange) used on ≤10% of any given screen. Navy carries authority; orange carries action.
- Real photography over illustration. When illustration is unavoidable, it's a thin line mark, not a cartoon.
- Class-year color is identity, never decoration. It appears on the user's own content; it never paints the chrome.

## 2. Colors

The palette is a warm-tinted neutral system with two strong roles (navy for authority, orange for action) and a deliberately small set of status and identity colors. Every neutral is biased warm; nothing in the system is mathematically gray.

### Primary
- **Signal Orange** (#f26522): The site's one true accent. Used on the primary CTA, the active nav state, the "NEW" badge, and the home-page eyebrow. Never used for body text, never used to fill a card background. Its rarity is the entire point.
- **Signal Orange Deep** (#d44e0f): Hover and pressed state for orange. Never appears standalone.
- **Signal Orange Soft** (#FFE9DC): A tinted background for the "SOON" event chip, the illustrated empty-state circle, and gentle highlights. Carries the orange identity without shouting.

### Secondary
- **Ground Navy** (#0a2342): The authority color. Fills the primary button, the digest hero card, officer-mode banners, and the footer ground. Carries seriousness; pairs with white text.
- **Ground Navy Deep** (#061629): Navy's hover state.
- **Ground Navy Soft** (#E6EAF2): A tinted background for school-wide chips and quiet emphasis blocks.

### Tertiary (status + identity)
- **Status Success** (#3E8E5A): "In progress" status pill, success toasts. Never used as decoration.
- **Status Pending** (#C68A1E): "Under review" status pill, gentle warnings.
- **Class Seniors** (#E15A1F), **Class Juniors** (#5D6FB8), **Class Sophomores** (#C68A1E), **Class Freshmen** (#7BB66B): Identity hues, surfaced as a thin top rule or a small dot on a user's own class content. Never used to paint chrome or backgrounds.

### Neutral
- **Page** (#f8f8f7): The page background. Off-white, warm-biased. The system's true canvas.
- **Surface** (#ffffff): Card and input fills. The only "pure white" the system uses, and only inside containers that need to lift off the page.
- **Rule** (#d9d6cf): Hairlines, card borders, divider lines. Warm and quiet.
- **Body** (#1c1b18): Body text. Near-black, biased warm. Never `#000`.
- **Muted** (#5a554b): Secondary text, captions, metadata.
- **Quiet** (#928c7e): Placeholder text, disabled labels, the quietest readable tone.

### Named Rules

**The One Voice Rule.** Signal Orange appears on ≤10% of any given screen. One CTA per surface, one active nav item, one badge per card. If two orange marks fight for attention, the design has failed.

**The Identity Stays in Its Lane Rule.** Class-year colors only paint elements that *belong to that class*. They never enter the chrome, the nav, the footer, or schoolwide content. A Junior should see the indigo accent on their own posts, never on the site itself.

**The Warm Neutral Rule.** Every neutral carries a faint warm bias (ink-50 through ink-950). Pure-gray `rgb(x,x,x)` is forbidden. Pure black and pure white are forbidden in body text and page surfaces.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Plus Jakarta Sans (with system-ui sans-serif fallback)

**Character:** Fraunces is a warm, contrast-rich modern serif with optical sizing — it lends the page the air of a published magazine without being precious. Plus Jakarta Sans is the workhorse: a warm humanist sans with generous x-height and friendly terminals, distinctive without being precious. Together they read as "published," never "wireframed."

### Hierarchy

- **Display** (Fraunces, weight 300, clamp(2rem, 5.5vw, 3.75rem), line-height 1.05): Home-page lede, page H1s. Sets the editorial register on first paint. Tracked tight (-0.02em).
- **Headline** (Fraunces, weight 400, clamp(1.5rem, 3vw, 2.25rem), line-height 1.1): Section ledes, idea-board entries, event titles when they need to feel like features.
- **Title** (Inter, weight 600, 1.125rem, line-height 1.3): Card titles, announcement titles in lists. Where Fraunces would feel too loud at small sizes.
- **Body** (Inter, weight 400, 1rem, line-height 1.6): Announcement and event copy, idea descriptions, all reading. Capped at 65–75ch.
- **Label** (Inter, weight 600, 0.75rem, line-height 1.4, letter-spacing 0.08em, uppercase): Form labels, eyebrows ("THIS WEEK · FOR JUNIORS"), audience chips. The mono-feeling element of the system.

### Named Rules

**The Display-Serif Rule.** Fraunces is for ledes and titles only. It never appears in chrome (nav, buttons, labels), and never on body copy. Misuse makes the page feel novelty-styled instead of published.

**The 65ch Rule.** Body copy never exceeds 75ch per line. On wide surfaces, body columns are capped even when the container could carry more. Reading rhythm beats column density.

**The Sentence-Case Rule.** Headlines, titles, and buttons are sentence-cased. Only labels (eyebrows, form labels, audience chips) are uppercase. Title Case on headings is forbidden — it reads as marketing collateral, not editorial.

## 4. Elevation

The system is flat by default. Surfaces lift off the page with hairlines (1px `ink-rule`) and a 16–20px corner radius, not with shadows. Shadows appear as a response to state — most often hover — not as ambient decoration. The home digest card is the one exception: it sits on the page with the weight of a full-bleed lede, no shadow needed; navy alone carries it.

### Shadow Vocabulary

- **Card Hover** (`box-shadow: 0 4px 24px -8px rgba(0,0,0,0.08)`): The only shadow in the system. Triggered by `:hover` on cards. Soft, low, warm — the page feels lifted, not glossy.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. The only shadow in the system fires on hover. Resting shadows are forbidden; they read as 2014-Material-card cliché.

**The No-Glass Rule.** `backdrop-filter: blur` and frosted-glass effects are forbidden. They belong to a different aesthetic family and will fight the editorial register on every page.

## 5. Components

Every component carries the same logic: warm white surface, warm hairline border, generous internal padding, restrained color. The visual identity is in the type and the photographs, not in the chrome.

### Buttons
- **Shape:** Pill (border-radius 999px). Pills feel approachable without rounding into kids'-app territory.
- **Primary:** `ground-navy` fill, white text, 10px × 20px padding. Used once per surface for the dominant action.
- **Accent:** `signal-orange` fill, white text. Used for the destination CTA on the digest card, and `New idea` on the suggestions surface. Never two accent buttons on the same screen.
- **Ghost:** Transparent fill, `ink-muted` text, hover bg `ink-100`. Used for back/cancel/secondary nav.
- **Hover / Focus:** 200ms ease transition on background. `:active` triggers a `scale(0.98)` press. Focus-visible ring: 2px `signal-orange`, 2px offset.

### Chips
- **Style:** Pill, white surface, 1px `ink-rule` border, `ink-muted` text, 0.75rem semibold.
- **Variants:**
  - *Audience chip* (announcement card): "Schoolwide" / "Juniors" / "Sophomores" — sets context.
  - *NEW chip* (announcement <48h old): `status-success` text on `ink-100`. Hidden when the post is also pinned.
  - *SOON chip* (event <24h away): `signal-orange-deep` text on `signal-orange-soft`.
  - *Status chip* (idea board): `status-success` for in-progress, `status-pending` for under-review.

### Cards / Containers
- **Corner Style:** Large pill-radius (16px, `rounded-2xl`). Soft but not childish.
- **Background:** `ink-surface` (#ffffff) on the `ink-page` canvas (#f8f8f7). The 1.5% lightness delta is enough to read as "lifted" without a shadow.
- **Border:** 1px `ink-rule` hairline at rest. `ink-300` on hover (one step darker).
- **Shadow:** None at rest. Card-hover shadow on `:hover` per Elevation.
- **Internal Padding:** 24px (md), 32px on hero cards.
- **Forbidden:** Nested cards. Side-stripe borders. Pure white backgrounds without a containing surface.

### Inputs / Fields
- **Style:** 12px radius (one step tighter than cards), white surface, 1px `ink-rule` border. 12px × 16px padding.
- **Focus:** Border shifts to `ground-navy`, 2px `ground-navy` glow at 10% opacity. No outline.
- **Label:** Always above, in the Label type role (uppercase, tracked, semibold, `ink-muted`).
- **Error:** Border shifts to `signal-orange-deep`, helper text below in `ink-muted`. Never red.

### Navigation
- **Style:** Top nav, 1px `ink-rule` bottom border, white background, Inter title-weight. Active item carries a `signal-orange` underline.
- **Mobile:** A fixed 5-tab bottom bar (Home / Events / Ideas / Clubs / Team), Lucide icons at 24px, active tab in `signal-orange` with weight 2.5 stroke. Visible only `<md`.
- **The two nav layers don't visually conflict:** top nav fades to a small logo + grade chip on mobile; the bottom bar takes over as the primary affordance.

### Signature Component: The Digest Card
- The home-page "This week for you" card. Navy `ground-navy` fill, full-bleed within the container, 32px padding, Fraunces summary sentence at headline scale, orange eyebrow label, three stat counters along the bottom.
- This is the only navy-on-large-surface moment in the system. It earns its weight because it carries the personalized lede.

## 6. Do's and Don'ts

### Do:
- **Do** lead pages with a Fraunces display headline and 24px of breathing room below it.
- **Do** keep `signal-orange` to ≤10% surface coverage per screen. One CTA, one badge.
- **Do** use `ink-50` as the canonical page background; reserve `#ffffff` for cards and inputs only.
- **Do** byline officer-authored content. Names build credibility.
- **Do** use class-year color *only* on a user's own content (the user's own posts, ideas, votes).
- **Do** use real photographs of real events. Crop them with intent.
- **Do** sentence-case everything except labels.
- **Do** name class years in copy ("Juniors", "Class of '28"), not as bare grade numbers.

### Don't:
- **Don't** use gradient text or `background-clip: text` anywhere. The existing `.gradient-text` utility in `globals.css` must be removed.
- **Don't** use side-stripe borders (`border-left` >1px as a colored accent). Use full hairlines, background tints, or numbers instead.
- **Don't** ship glassmorphism, `backdrop-filter: blur`, or frosted surfaces. They belong to a different aesthetic.
- **Don't** render the hero-metric SaaS template: big number, gradient accent, supporting stats. The digest card is a *sentence*, not a stat grid.
- **Don't** build identical three-up feature grids of icon + heading + paragraph.
- **Don't** use pure `#000` or `#fff` in body text or page chrome. Warm-tinted neutrals only.
- **Don't** make the site look like Schoology, Blackboard, or PowerSchool. The whole product exists to refuse that aesthetic.
- **Don't** use cartoon mascots, Duolingo-style streak gamification, or oversized rounded buttons. Students are not children.
- **Don't** use exclamation marks in chrome. Energy comes from typography and photography, not punctuation.
- **Don't** Title-Case headings. That's marketing voice, not editorial voice.
- **Don't** nest cards inside cards. Always wrong.
- **Don't** put body copy in Fraunces. The serif is for ledes and titles.
