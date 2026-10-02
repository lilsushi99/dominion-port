# DASHBOARD — Admin Visual & Interaction System

Admin frontend route prefix: `/hippo` (e.g. `/hippo/login`, `/hippo`, `/hippo/projects`, `/hippo/cms`, `/hippo/categories`, `/hippo/papers`, `/hippo/media`, `/hippo/footer`). All `/hippo` routes are tagged with `robots: { index: false, follow: false }` and excluded from sitemap.

Reference: the uploaded "FlowMail" dashboard screenshot (light theme, framed app shell, soft neutral surfaces, indigo accent). It is the visual foundation. This document defines what we **keep**, what we **adapt**, and what we **remove**. Colors below were sampled and estimated from the 1024×768 screenshot; treat them as design tokens that can be tuned in one file (`admin/styles/tokens.css` or `styles/admin-tokens.css`).

## 1. Reference analysis

| Area | Observed in reference | Decision |
|---|---|---|
| Canvas | Cool light grey (~`#e6e9ec`) surrounding the app; the app is a floating rounded frame | Keep, but the frame goes edge-to-edge on screens < 1100px |
| Frame | Radius ~24px, white-ish | Keep (radius 20px) |
| Sidebar | ~160px wide, off-white (`#fdfcff`), logo top-left, collapse icon, icon+label nav, user block pinned bottom, thin divider above it | Keep. 224px wide (labels are longer) |
| Main bg | Faint lavender grey (`#f6f5fa`) | Keep |
| Top bar | Breadcrumb/page label left; search, bell, accent button right | Keep breadcrumb + account menu. **Remove** bell, global search (no use yet) and the "AI Insight" gradient button |
| Page title | ~22px semibold, muted one-line subtitle, primary action button at right | Keep exactly |
| Stat cards | White card, small icon + label + kebab, value inside a pale inset "well" with a tinted delta chip | Keep card + well. **Remove** kebab and delta chips (no fake trends). Show real counts only |
| Section card | Large white card, radius ~20px, title left, segmented control right | Keep |
| List items | Cards with icon chip, title, subtitle, status chip, icon actions, metric wells | Adapt into table-like rows (see §9) |
| Status chip | Dot + label, tinted fill (green active, red inactive) | Keep (Published / Draft) |
| Primary button | Indigo fill, white label, leading icon, ~10px radius, slight gradient | Keep, **flat fill, no gradient** |
| Segmented tabs | Pale grey trough, active segment white | Keep |
| Icons | 16–18px outline icons, 1.5px stroke | Keep; use Lucide-style outline set. No sparkle/AI/decorative icons |
| Shadows | Extremely soft | Keep subtle (see §3) |
| Avatar photo | Present | Replace with a monogram circle |

Removed on purpose: gradients, AI affordances, trend arrows, notification bell, fake stats, decorative status colors beyond green/red/amber.

## 2. Layout
- Shell: `display:grid; grid-template-columns: 224px 1fr;` inside a frame, max-width 1440px, margin 24px auto, min-height `calc(100dvh - 48px)`.
- Sidebar: padding 16px. Logo row 40px high (site name "Dominion" + "admin" in muted text, no logo mark). Nav items 40px high, 8px radius, 10px gap between icon and label. User block at bottom with 1px divider above.
- Main: padding 24px 32px 40px. Top bar height 56px. Content max-width 1120px (forms: 760px, editor: 820px).
- Grid: 12 columns, 20px gutters. Stat row = 4 columns (2 on tablet, 1 on mobile).
- Page structure: top bar → page header (title/subtitle left, primary action right) → content cards stacked with 20px gap.

## 3. Tokens

**Color**
```
--canvas:        #e6e9ec   outer backdrop
--surface:       #fdfcff   sidebar, cards, inputs
--page:          #f6f5fa   main background, wells, hovered rows
--well:          #f6f5fa   inset value/metric panels
--border:        #e4e3ea   1px lines (cards, inputs, dividers)
--border-strong: #cfcdd8   input hover
--text:          #16151c   headings, values
--text-2:        #4a4955   body
--text-3:        #86858f   labels, subtitles, placeholders
--accent:        #5b4be0   primary buttons, focus ring, links, active tab text
--accent-hover:  #4d3ed1
--accent-soft:   #ece9fd   selected/icon chip background
--ok:   #12874f  --ok-bg:  #e3f6ec
--bad:  #d92d4a  --bad-bg: #fde8ec
--warn: #a35c00  --warn-bg:#fff1dc
```
No gradients anywhere. Dark mode: not in scope.

**Typography**: Inter (self-hosted via `next/font` or `@fontsource/inter`). Reference is a clean neo-grotesque of this kind.
| Role | Size / line | Weight |
|---|---|---|
| Page title | 22 / 28 | 600, −0.01em |
| Section title | 18 / 24 | 600 |
| Card label | 13 / 18 | 500, `--text-2` |
| Stat value | 28 / 32 | 500 |
| Body / table | 14 / 20 | 400 |
| Input text | 14 / 20 | 400 |
| Caption / helper | 12 / 16 | 400, `--text-3` |
| Nav label | 14 / 20 | 500 (active 600) |
| Button | 14 / 20 | 500 |

**Spacing** (4px base): 4, 8, 12, 16, 20, 24, 32, 40.
**Radius**: frame 20, card 16, well 12, input/button 10, chip 999 (status chip only), nav item 8, modal 16.
**Borders**: 1px `--border` on cards and inputs, 1px dividers, 1.5px icon strokes. No double borders.
**Shadow**: cards `0 1px 2px rgba(22,21,28,.04)`; modals `0 12px 40px rgba(22,21,28,.14)`; nothing else.

## 4. Navigation
Sidebar items (outline icon + label): Dashboard · Home (CMS) · Contact buttons · Projects · Categories · Papers · Media · Footer. Bottom: user block (monogram, email, dropdown → Change password, Log out) and "View site ↗".
- Active: background `--page`, text `--text`, weight 600. Inactive: `--text-2`. Hover: background `--page`.
- Sidebar collapses under 1024px to a drawer opened by a menu button in the top bar. Under 640px the frame loses radius and margin.

## 5. Components

**Buttons** (height 40px, padding 0 16px, radius 10)
- Primary: `--accent` fill, white text, optional 16px leading icon. Hover `--accent-hover`. Active: translateY(1px). Disabled: 45% opacity, `not-allowed`. Loading: label stays, spinner (16px, 2px stroke) replaces icon.
- Secondary: `--surface` fill, 1px `--border`, `--text`. Hover `--page`.
- Danger: `--surface`, text `--bad`, 1px `--bad-bg`; confirm button inside modals is `--bad` fill.
- Icon button: 32×32, radius 8, 1px `--border`, hover `--page`.
- Focus (all): 2px `--accent` outline, 2px offset.

**Inputs** (height 40, radius 10, 1px `--border`, `--surface`, padding 0 12px)
Label above (13/500), helper/error below (12). Hover border `--border-strong`. Focus: border `--accent` + 3px `rgba(91,75,224,.15)` ring. Error: border `--bad`, message in `--bad`. Disabled: `--page` fill. Textarea min-height 120, vertical resize. Select = native `<select>` styled with chevron. Date: three fields **Month (optional) / Day (optional) / Year (required)**; Day disabled until Month chosen.

**Tabs / segmented control**: trough `--page`, radius 10, padding 3; segment 30px high, radius 8; active = `--surface` + `--text`, others `--text-3`.

**Chips**: 24px high, 8px side padding, dot (6px) + label 12/500; Published (ok) · Draft (warn) · Inactive (bad). Only here is a full-pill radius used.

**Cards**: `--surface`, 1px `--border`, radius 16, padding 20. Stat card = label row (icon 16 + label) then a `--well` inset (radius 12, padding 12 16) with the value. Header row of a card: title left, actions right, 16px gap below.

**Tables** (lists of projects, papers, categories, media)
- Header 12/500 `--text-3`, uppercase **off**, 40px high, bottom border.
- Rows 64px, 1px bottom border, hover `--page`. Columns for projects: thumbnail (48×36) · title+summary · category · year · status chip · actions (edit, view, delete as icon buttons).
- Row actions on the right; the whole row is not clickable except the title.
- Pagination: simple "Prev / Next" secondary buttons with "1–20 of 64".
- Mobile: rows collapse to stacked blocks (title, meta line, actions).

**Modals**: backdrop `rgba(22,21,28,.4)`, panel radius 16, width 440 (confirm) / 560 (form), padding 24, title 18/600, footer right-aligned buttons. Esc and backdrop close unless an upload is running. Focus is trapped; focus returns to the trigger.

**Dropdown menu** (account, row "more"): `--surface`, 1px border, radius 10, padding 4, items 36px high, hover `--page`.

**Toasts**: bottom-right, 360px, `--surface`, 1px border, left 3px status bar; auto-dismiss 4s (errors persist until closed).

## 6. States
- **Loading**: skeleton blocks (`--page`, radius 8, no shimmer gradient; use opacity pulse 1.2s) matching final layout. Buttons show spinner. Never a blank page.
- **Empty**: centered inside the card: 15/600 title ("No projects yet"), one line of 13px help text, a primary button ("Create project"). No illustrations.
- **Error**: inline banner at the top of the card (`--bad-bg`, 1px `--bad` at 20%, 14px text, "Try again" link). Field errors under fields. Network failure keeps the user's unsaved form data.
- **Success**: toast ("Project saved"). Publish toggles update the chip immediately after server confirmation.
- **Confirmation**: every delete uses a modal naming the item ("Delete 'Nexus ERP'? This removes its media and cannot be undone"). Leaving a form with unsaved changes prompts a confirm.
- **Disabled**: 45% opacity, no hover change, tooltip explaining why where non-obvious.

## 7. Login page
Centered 380px card on the `--canvas` backdrop; site name above; **Email or username**, **Password** (with show/hide toggle), **Log in** button (full width). Nothing else: no sign-up, no "forgot password" link unless implemented, no demo credentials, no marketing copy. Errors show one generic line: "Those details don't match." Rate-limit message: "Too many attempts. Try again later." Autofocus first field; Enter submits.

## 8. Dashboard (overview) page
Header: "Dashboard" / "A summary of your portfolio". Stat row (real DB counts): **Projects** (published/draft split inside the well as small text), **Papers**, **Categories**, **Media files** (with total size). Below: a card "Projects by category" as a simple two-column list with a thin proportional bar (flat `--accent` on `--page`), a card "Recently updated" (last 6 items across projects and papers, with status chip and relative time), and a card "Needs attention" (drafts, projects with no summary or no primary media). Cards that have nothing to show use the empty state. No fabricated numbers, no trend indicators.

## 9. Forms

**General**: single column, max-width 760px, 24px between field groups, section headings (16/600) with a 1px divider. A sticky bottom bar (surface, top border) holds **Save draft**, **Publish**, and **Cancel**; it shows "Saved 12:04" or "Unsaved changes".

**Home / Hero**: rich-text editor (see §10) with the label "Introduction". Helper: "Select text and use the link button to attach a URL." Sign-off text field. "Preview on site ↗".

**Contact buttons**: sortable list of rows: drag handle · label · URL · Active switch · delete. "Add button". Reorder by drag or by up/down icon buttons (keyboard-accessible).

**Projects section & categories**: heading text field; categories as the same sortable row list (name, slug auto, Active switch).

**Create/Edit Project** (in order): Title* · Publication date (Month, Day, Year*) · Category* · Primary media (upload) · Project URL · Link label · Summary* (textarea, character counter without a hard limit) · Description 1* / 2* / 3* (multi-line text areas that grow, no max length) · Gallery · Publish status.

**Footer**: copyright year (mode: "automatic" or "fixed" + number), copyright text, "Designed by" text, designer name, designer URL. Live one-line preview.

## 10. Upload UI & editors

**Image upload (single)**: dashed 1px `--border-strong` drop zone, 160px high, "Drop an image or browse" and "JPG, PNG or WebP · up to 10 MB". After upload: preview (natural ratio, max-height 280), filename, dimensions, size, **Replace** and **Remove** buttons. Alt text input is required.

**Video upload**: same drop zone ("MP4, WebM or MOV · up to 200 MB"); progress bar (4px, `--accent` on `--page`, percentage label, Cancel); after upload, an inline `<video controls>` preview, duration, size, and a **Poster image** sub-uploader (optional; auto-generated frame if supported). Errors: wrong type, too large, upload failed (retry button).

**Primary media chooser**: a segmented control `Image | Video` above the drop zone; switching shows the matching uploader and keeps the other's file until saved.

**Gallery uploader**: multi-file drop zone, "n of 10". Each item is a row: drag handle · 72px thumbnail · caption input (italic placeholder "Caption") · alt text · remove icon. Reorder by drag and by up/down buttons. Upload progress per item. The drop zone disables at 10.

**Rich-text editor (Papers)**: TipTap. Toolbar (sticky under the top bar, `--surface`, 1px bottom border, 36px icon buttons, active = `--accent-soft` + `--accent`): Paragraph/Heading 2/Heading 3 dropdown · Bold · Italic · Link · Quote · Bullet list · Numbered list · Image · Video · Undo/Redo. Content area: 820px, 17px / 1.7 text to resemble the public article. **Link**: opens a small popover with URL field, "Open in new tab" checkbox, Apply/Remove. Media insert opens the upload modal (device upload only) and inserts a block node that is selectable, shows a caption field, and has remove/replace controls. A trailing empty paragraph is always available so writing continues below media. Autosave draft every 30s.

**Rich-text editor (Home)**: same component in "inline" mode: Bold, Italic, Link, Undo/Redo only; paragraphs allowed; no headings or media.

## 11. Responsive
- ≥1280: full layout. 1024–1279: content max-width fluid, stat row stays 4-up with smaller padding.
- 640–1023: sidebar becomes a drawer; stat row 2-up; tables keep columns but hide Category and Year (shown under the title).
- <640: single column; page header stacks (action button full width); tables become stacked rows; sticky save bar stays at the bottom; editor toolbar scrolls horizontally.
- Touch targets ≥ 40px. No horizontal page scroll.

## 12. Interaction principles
Transitions 120ms (color, background, border, opacity). No bounce, no scale, no parallax. Drag-and-drop always has a keyboard alternative. Everything is operable with the keyboard; visible focus everywhere; `aria-live` for toasts and upload progress.

## 13. Prohibited
Gradients (fills, borders, text) · glow · glassmorphism · sparkle/AI icons · decorative illustrations · fake metrics or trend arrows · notification bell with no function · pill buttons (only status chips are pills) · Bootstrap/MUI/Ant default look · more than one accent color.
