# DESIGN — Visual Source of Truth

The two reference screenshots are the design authority. This document records what they show and how it applies here.

## 1. Reference analysis

**Reference 2 (home + list)**
- One narrow column (~655px of a ~1358px viewport, about 48%), centered. Large empty margins either side.
- Opens straight into the letter at ~170px from the top. No header.
- All text is lowercase, small (~15px), generous line-height (~1.75), ash grey rather than white.
- Hierarchy comes from weight only: normal vs bold. Bold marks identity phrases and companies.
- Links are bold/lighter and underlined, inline in sentences.
- Paragraphs are separated by one blank line of space (~1.5em), with sign-off lines stacked tightly.
- A "p.s." lead-in then the list.
- List row grid: `year | title + arrow / description | thumbnail`. Year is muted and slightly bold; title is brighter; description is smaller and dimmer (~13px). Rows are separated only by space (~45–60px), no borders. Thumbnails sit flush right (~40px in reference).
- Arrow glyphs are tiny and dim: `→` for internal pages, `↗` for external links.

**Reference 1 (detail)**
- Same column. `back` (dim) → title (brighter, slightly larger, bold) → date (dim) → media (full column width, small ~6px radius) → underlined link → short paragraphs.
- Nothing else on the page.

**Background**: flat charcoal, around `#2a2a2a`, with a fine, low-contrast noise/grain (reads like woven paper). No vignette, no gradient.

## 2. Tokens
```
--bg:        #2a2a2a   (base)
--text:      #b9b8b2   (body ash)
--text-hi:   #d6d5cf   (titles, bold, links)
--text-mid:  #8f8e89   (years, dates, back)
--text-low:  #75746f   (descriptions, arrows)
--rule:      rgba(255,255,255,0.08)  (use very sparingly)
--radius:    4px  (media only)
--col:       655px
```
Contrast must stay subtle but readable: body text must still meet WCAG AA against `--bg` (check `--text-low`; raise if it fails).

Noise: a small tiled PNG/SVG-turbulence (~3% opacity) applied to `body::before`, `pointer-events:none`. No gradient anywhere.

## 3. Typography
- **Family:** Inter Tight (via `next/font`, self-hosted for performance), weights 400/500/600. It reproduces the reference's tight, neutral grotesque feel with slightly heavy lowercase. Not Space Grotesk; nothing geometric or "techy".
- Body 15px / 1.75. Descriptions 13px / 1.7. Title on detail page 20–22px, weight 600, tracking −0.01em.
- Body copy rendered lowercase to match the reference (CSS `text-transform` must **not** be used on user content; lowercase is an authoring choice so real names, acronyms like ERP/POS/CRM/LMS and article text stay correct). Only UI labels and the intro may be authored in lowercase.
- Detail paragraphs: `text-align: justify; hyphens: auto;` on tablet and desktop. On mobile, fall back to left-aligned to avoid rivers.

## 4. Layout
- Desktop: column 655px, top padding ~170px, bottom padding ~160px.
- Tablet: column `min(655px, 100% − 64px)`.
- Mobile: side padding 24px, top ~72px. Row layout becomes: year + title on one line, description below, preview image below at full column width (the larger preview lives on its own line instead of being shrunk to a thumbnail).
- Project previews on desktop are larger than the reference's 40px icons: roughly 120×80 right-aligned (aspect preserved, `object-fit: cover` only for the preview slot). On hover the row dims siblings slightly (opacity), nothing more.
- Gallery images may break out of the column to ~min(1100px, 92vw); single images keep their natural ratio, always `height: auto`.

## 5. Components (keep this list short)
`IntroLetter` · `InlineLink` · `ContactLinks` · `CategorySwitch` · `ProjectRow` · `BackLink` · `ProjectMedia` · `Gallery` · `ArticleBody`

**CategorySwitch**: plain text items in a row (`web development  product design  papers  dashboards`); the active one is bright with an underline, others dim. No pills, no borders, no background.

**ProjectRow**: whole row is one `<a>`. Arrow nudges 2px on hover. Nothing else.

**ProjectMedia**: `<video controls playsinline muted loop preload="metadata" poster>`; autoplays muted when in view for web/dashboard demos; respects `prefers-reduced-motion` (no autoplay). Image variant for dashboards. Never YouTube.

## 6. Interaction
- Link hover: color to `--text-hi`, underline offset 3px. Transitions 150ms, opacity/color only.
- Category change: content swap with a 150ms fade. No sliding, no staggered entrances, no parallax.
- Page transitions: none or a simple fade.
- Focus states must be visible (1px outline in `--text-hi`).

## 7. Responsive behavior
Never just shrink desktop. See §4. The path stays Introduction → Work → Project → Contact. No mobile menu.

## 8. Explicitly prohibited
Gradients (fills, strokes, borders, text) · glow/neon · glassmorphism · big rounded cards · pills and badges · tag clouds · sparkle/star/AI/database/server/CPU icons · decorative circles, dots, blobs · three-layer headings · "what I do" filler sections · SaaS dashboard aesthetics · heavy shadows · excessive animation · header/nav of any kind · pure `#fff` text everywhere.

Rule of thumb: if the reference doesn't have it and the content doesn't require it, remove it.
