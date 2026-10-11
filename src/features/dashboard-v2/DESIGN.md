# Dashboard v2 — design brief

Design checkpoint for `/test/dashboard`. Mode is **Operate/Read**: the visitor is
answering "what's next, what just happened, who's winning". Scanability and
trustworthy figures outrank expression. Brand lives in precise details, not decoration.

Reference: formula1.com (structure and restraint, studied from screenshots) + the
placement principles in the task brief. Fonts are the ones already loaded in
`index.html`. Colour comes from `src/index.css` tokens only.

---

## 1. Type scale

Fixed rem steps, not fluid. Three families, each with one job.

**Display — Barlow Condensed, 700/800, uppercase, `tracking-[-0.02em]`, `leading-[0.95]`**

| Step | Use | 390 | 768 | 1280+ |
|---|---|---|---|---|
| `d1` | Hero race name | 44px | 60px | 76px |
| `d2` | Section heading | 28px | 34px | 40px |
| `d3` | Row / card title | 18px | 20px | 22px |

Display max 76px (under the 6rem ceiling). Headings are **left-aligned**, with any
secondary action right-aligned on the same baseline.

**Sans — Barlow, 400/500/600**

| Step | Use | Size |
|---|---|---|
| `body` | Prose, descriptions | 15px / `leading-relaxed` |
| `sm` | Secondary, team names, status | 13px |
| `label` | Column headers, fact labels | 11px, uppercase, `tracking-[0.1em]`, `--text-muted` |

Prose capped at 65ch. Tables may run wider.

**Mono — JetBrains Mono, 500/600, `tabular-nums` always**

Every figure: points, times, gaps, dates, round numbers, countdown. 13px in table
cells, 15px in rows, 36px/48px for the countdown. Mono is used here for
measurement, not as a "technical" costume.

## 2. Spacing scale

4px base.

- Section gaps: 40px mobile, 56px tablet, 72px desktop (implemented as 20px, 28px, 36px padding top and bottom).
- Container: `max-w-[1560px]`, gutters 20 / 32 / 48.
- Table row height: 56px mobile, 64px desktop. Cell padding 16px.
- Card padding: 24px.
- Header height: 64px (within the 64–72px band, 80px hard cap).

## 3. Corner radius — one documented rule

- Containers, panels, cards, table rows, inputs, etc: **4px**
- Interactive pills, toggles, tabs, and avatar circles: **full round**

No other radii anywhere. Mixed systems are broken design unless the rule is written
down, so this is the rule.

## 4. Colour usage

Tokens only. No hex in components. Both themes polished.

| Role | Token |
|---|---|
| Page | `--bg` |
| Panels, cards | `--surface-1` |
| Row hover, inset | `--surface-2` |
| Dividers | `--border-subtle` (1px) |
| Primary text | `--text` |
| Labels, secondary | `--text-muted` |

**F1 red (`--accent`) has exactly three uses.** Nothing else gets red.

1. The primary button fill — one per view ("View race weekend")
2. Active state — nav item, pill nav, standings tab
3. One accent rule — the full-width sheared red bar, used **once**, separating the
   hero from the content below



**Team colour** appears as a **2px marker only**: a left edge on standings rows, a
top edge on driver cards. Never a fill, never wider than 2px.

**Status is plain text.** No chips, no badges, no dots. Differentiation is weight and
colour only: finished = `--text` at 600, scheduled = `--text-muted` at 400. The word
"live" appears only when `WeekendSession.isLive` is true from data.

Missing values render as an em dash (`—`), never hidden, never invented.

## 5. Motion rules

Transform and opacity only. Custom easings from `index.css`
(`--ease-out: cubic-bezier(.22,1,.36,1)`). Content is visible in its default state so
a failed script never hides the page.

**One authored moment.** The hero's fact rows and session list arrive as a short
stagger — 220ms each, 40ms apart, total capped at 240ms, `translateY(6px)` → `0`.
Sections below reveal with a subtle fade-up (`whileInView`, opacity and `translateY(20px)` → `0`).
Every section is backed by an immediate fallback for `prefers-reduced-motion` and an
unconditional 1.5s safe timeout fallback so content is guaranteed to render even if the
IntersectionObserver does not fire or in static capture environments.

| Interaction | Spec |
|---|---|
| Link hover | underline, `text-underline-offset: 3px`, 150ms |
| Card hover | `translateY(-2px)`, 150ms |
| Press | `scale(0.98)`, 120ms |
| Tab / pill active indicator | slide 200ms `--ease-out` |
| Drawer | enter 260ms, exit 180ms (exit always faster) |
| Timezone dropdown | scales from its trigger, not centre |

All hover effects gated behind `@media (hover: hover) and (pointer: fine)` so touch
taps don't trigger them.

Scroll-spy uses **IntersectionObserver**. A `scroll` listener or `window.scrollY` in
React state is banned — it re-renders every frame.

Reduced motion removes movement but keeps opacity and colour so feedback stays
legible.

## 6. Structural choices

- **Rows over cards.** This is a data-dense surface, so Results, Standings and
  Calendar group with 1px dividers and whitespace — no card chrome. Cards are used
  only where each item is a discrete object: the driver grid. Nested cards never.
- **No eyebrows.** No small uppercase label above any heading. Round numbers and
  dates are data in their own columns, not decorative kickers.
- **One primary button per view.** Secondary actions are plain links.
- **Loading** uses skeletons shaped like the final layout, reusing the existing
  `.skeleton-shimmer` class. **Errors** are one quiet line of muted text with a retry
  link. **Empty** states say what would appear here.
- **Browser surfaces get themed**: focus ring, text selection, scrollbar, underline
  offset, tabular numerals. Visible 2px focus ring on every interactive element.

---

## Logged deviations from the task brief

| Spec said | Shipping | Why |
|---|---|---|
| Centred section headings | Left-aligned | Approved. formula1.com left-aligns every heading; centred titles fight left-aligned table content |
| Countdown digit tick | **No per-digit animation** | A digit changing every second is seen constantly; animating it is noise, and f1.com's own countdown doesn't. Tabular mono stops digits shifting. Say the word and I'll add a 120ms opacity tick |
| One staggered fade-up on load | Hero + subtle section reveals | Hero leads with authored stagger; subsequent sections reveal via whileInView with 1.5s fallback & reduced-motion bypass |
| Soft cards with one marker each | Cards for drivers only | Generic card containers are banned on dense data; dividers read cleaner |

## Data gaps

1. **Calendar winners are not available.** `useSchedule` returns `F1Race`, which has
   no winner field. Winners will render as `—` for completed rounds, with the race
   start time shown for upcoming ones.
2. `public/data/2026/meta.json` *does* carry winners, but it marks **all 23 rounds
   complete** and its winners contradict the live standings. Treating it as truth
   would put contradictory numbers on one page, so it is **not used**.
3. **`useLastRaceResult` is required** for the Latest Result section (podium + top 10).
   It wasn't in the enumerated hook list but it is an existing hook in
   `src/api/useF1Data.ts`, so no new data layer is added.
4. The live Jolpica API is unreachable from the build sandbox, so rendered values
   can't be verified here — only types, lint, and layout. Your browser will fetch real
   data normally.
5. **Primary button contrast needs checking**: white on `--accent` is near the AA
   boundary. To be verified programmatically; if it fails, the label goes to 600 weight
   at 16px (AA large) or the darker `--accent` light-mode value.


