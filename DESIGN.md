# DESIGN CONSTITUTION & SPECIFICATIONS — DOMINION PORTFOLIO

## 1. Typography & Colors
- **Font**: Inter Tight / System UI font.
- **Base Theme (Dark Mode)**:
  - Background: `#2a2a2a`
  - Text Primary: `#eae9e4`
  - Text Body: `#b9b8b2`
  - Text Muted: `#8f8e89`
- **Light Theme**:
  - Background: `#f7f6f2`
  - Text Primary: `#16151c`
  - Text Body: `#4a4944`
  - Text Muted: `#6f6e69`

## 2. Category Filter Buttons (Explicit Specification Override)
- **Shape & Size**: Real `<button>`s with modest 8px radius (`rounded-[8px]`, NOT full pills).
- **Padding**: `px-3.5 py-2` (approx 8x14px), minimum 40px touch height target.
- **Dark Mode**:
  - Active: White/Light background (`#eae9e4`) with dark text (`#16151c`), `font-medium`, `aria-pressed="true"`.
  - Inactive: Transparent background with 1px border (`#444444/60`) and muted text (`#8f8e89`), hovering increases contrast.
- **Light Mode**:
  - Active: Black/Dark background (`#16151c`) with light text (`#f7f6f2`), `font-medium`, `aria-pressed="true"`.
  - Inactive: Transparent background with 1px border (`#d0cfcb`) and muted text (`#6f6e69`), hovering increases contrast.
- **No Brackets**: Square brackets (`[ all ]`) and underlines are omitted.

## 3. Hover Pop-Out Cover Images
- **Scale**: Cover image scales ~1.8x with a translateY(-4px) and soft shadow on desktop hover / focus-within.
- **Transform**: Strictly transform-based with `origin-right`, zero layout reflow or height shifts.
- **Mobile Touch**: Subtly scales (~1.12x) for item centered in viewport.

## 4. Floating "See What I Built" Blob
- Fixed-position organic paint-splash SVG path at bottom-right.
- Fades out via `IntersectionObserver` when the work section enters the viewport.
