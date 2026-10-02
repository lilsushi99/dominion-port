# REQUIREMENTS

## 1. Functional
- F1. `/` renders the introduction, sign-off, four contact links and the work list, with no header or nav.
- F2. Intro text contains inline links for companies, resolved from DB data (tokens, see PROJECT.md).
- F3. Category switcher filters the list (web-development, product-design, papers, dashboards) without a full reload; selection is reflected in the URL (`?c=`).
- F4. Each row shows year, title, arrow, description and preview; the entire row is a link. Papers link to `/papers/[slug]`, others to `/work/[slug]`.
- F5. Project page: back link, title, year, primary media, live-URL button (hidden if no URL), exactly three paragraphs, optional gallery.
- F6. Primary media is `video` or `image` per project (`primary_media_type`). Video is self-hosted, with poster image.
- F7. Dashboards support both media types; the admin picks one.
- F8. Paper page: title, date, ordered content blocks (heading, paragraph, image with caption, figure, quote, list, code/data, link).
- F9. Back returns to the home page with the previous category and scroll position preserved.
- F10. 404 and error pages in the same visual language.

## 2. Content
- C1. No content hardcoded in components. All copy, links, projects and papers come from the API.
- C2. Dummy content lives only in backend seed files / SQL seed, using the same schema as production data.
- C3. Project description is exactly three paragraphs (all three required to publish).
- C4. Gallery: 0..n images, ordered, each with width/height stored for layout stability.
- C5. Intro, companies, contact links, section heading wording are editable data.

## 3. Technical
- T1. Frontend: Next.js (App Router, TypeScript). Server-render pages for SEO; fetch from the Express API.
- T2. Backend: Express.js REST API (JSON), MySQL via `mysql2` (or a light query builder). No ORM unless needed.
- T3. Database: MySQL, managed through phpMyAdmin. Schema supplied as versioned `.sql` migrations.
- T4. Hosting: Hostinger. Two Node.js apps (frontend and API, e.g. `domain.com` and `api.domain.com`), MySQL on the same account.
- T5. Per-page SEO metadata, Open Graph image, sitemap.xml, robots.txt, canonical URLs, semantic HTML (this is also a portfolio of SEO skill).
- T6. Accessibility: WCAG AA contrast, keyboard navigable, alt text required for every image, `prefers-reduced-motion` respected.
- T7. Performance: Lighthouse ≥ 90 on mobile for home; `next/image` for images; self-hosted font; video `preload="metadata"`.
- T8. No unnecessary dependencies: no UI kit, no animation library, no CSS framework required (CSS Modules or plain CSS with tokens).
- T9. Environment config via `.env` (`API_URL`, `DATABASE_*`, `UPLOAD_DIR`, `PUBLIC_MEDIA_URL`, `ADMIN_JWT_SECRET`).

## 4. Responsive
- Breakpoints: ≥1024 desktop, 640–1023 tablet, <640 mobile.
- Layouts per DESIGN.md §4. Touch targets ≥ 44px on mobile.
- Video and images never overflow the viewport; aspect ratios reserved to prevent layout shift.

## 5. Media
- Video: MP4 (H.264/AAC), optional WebM; recommend ≤ 1080p and ≤ ~25 MB per clip; served with HTTP range requests; poster image required.
- Images: JPG/PNG/WebP; originals kept, responsive variants generated (e.g. 640/1200/2000 wide) and `width`/`height` saved.
- Never stretch or crop gallery or article images.
- Stored on server disk (`/uploads`) behind a storage abstraction so it can move to object storage later.

## 6. Database
Tables: `profile`, `companies`, `contact_links`, `categories`, `projects`, `project_gallery`, `articles` (or `projects` with category papers), `article_blocks`, `media`, `admin_users`. Full definition in PROJECT.md. Requirements: utf8mb4, foreign keys, `sort_order` columns, `status` (draft/published), `created_at`/`updated_at`, unique slugs.

## 7. Future admin
- Auth (JWT/session, bcrypt), single admin to start.
- CRUD for everything above, drag-to-reorder for gallery, blocks and companies.
- Upload endpoints with type and size validation.
- Live-preview of intro with tokens resolved.
- Draft/publish. No frontend redeploy needed to change content (use Next.js revalidation: tag-based or on-demand `revalidate` webhook from the API).

---

# Addendum: CMS, Admin & Persistence (Phase 2)

- A1. Content source: MySQL only. No `db.json`, no LocalStorage content, no hardcoded editable content, no fake APIs in production code. Seed data uses the production schema and can be deleted.
- A2. Auth: login page only (no sign-up, no visible credentials, none in source). Admin created via CLI script. Hashed passwords, server-side sessions, rate limiting, CSRF protection.
- A3. Dashboard: real counts from SQL (projects total/published/draft, by category, papers, categories, media). No placeholder numbers.
- A4. Home intro: rich text (paragraphs, bold, italic, links on selected text); formatting and links survive save → API → public render.
- A5. CTA buttons: add, remove, edit label/URL, reorder, activate/deactivate.
- A6. Categories: full CRUD, reorder, activate/deactivate; projects reference `category_id`. Projects-section heading comes from the DB.
- A7. Projects: title*, date (year required, month/day optional), category*, primary media (device upload: image or video), URL + label, summary (separate field), three unlimited-length description sections, gallery up to 10 images with captions (italic on the public site), publish/unpublish, reorder.
- A8. Papers: title, unique slug, date, rich content (headings, quotes, bold, italic, links, images, videos), draft/published, timestamps. Media inserted by `mediaId`, never by raw path.
- A9. Footer: editable copyright (automatic or fixed year), text, designer name and URL.
- A10. Media: type + magic-byte validation, size limits, generated filenames, files stored in `UPLOAD_DIR` outside the repo/deploy folder; uploads and DB survive redeploys.
- A11. Admin UI follows `DASHBOARD.md`; public design unchanged.
- A12. End-to-end acceptance: log in → edit intro with a link → change a CTA → create a project with video, summary, 3 sections, gallery → create a paper with formatting, image and video → publish → all of it appears on the public site and still does after a redeploy.
