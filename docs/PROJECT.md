# PROJECT — Architecture & Engineering Notes (v2: CMS + Admin)

Flow: **Admin (Next.js /hippo) → Express API → MySQL + persistent media folder → Public site (Next.js)**. MySQL is the only source of truth. No JSON files, no LocalStorage for content, no mock data in production code.

## 1. Stack
Next.js (App Router, TypeScript) · Express.js · MySQL (mysql2) · phpMyAdmin · Hostinger Node.js apps. Editor: TipTap. Auth: argon2 (or bcrypt) + server-side sessions.

## 2. Repository layout
```
portfolio/
├─ docs/                       PRD, DESIGN, DASHBOARD, REQUIREMENTS, PROJECT
├─ frontend/                   Next.js: public site + /hippo (noindex, nofollow)
│  ├─ app/(site)/              existing public pages (design unchanged)
│  ├─ app/hippo/               login, dashboard, home, cta, projects, categories, papers, media, footer
│  ├─ components/site/  components/admin/  components/editor/ (TipTap + custom nodes)
│  ├─ lib/api.ts               typed client (public + admin)
│  └─ styles/                  tokens.css (site), admin-tokens.css (DASHBOARD.md)
├─ backend/
│  ├─ src/
│  │  ├─ app.ts, server.ts, config/env.ts (validates env on boot)
│  │  ├─ routes/public/  routes/admin/
│  │  ├─ controllers/  services/  repositories/ (SQL lives here)
│  │  ├─ middleware/ auth, csrf, rateLimit, upload, errors
│  │  ├─ storage/ (local-disk driver: save, delete, stream, stat)
│  │  └─ scripts/ migrate.ts, create-admin.ts
│  └─ migrations/ 001_init.sql … (sequential, idempotent runner + `migrations` table)
└─ .env.example (names only, no values)
```
Code is Git-controlled. **Uploads are never inside the repo or the deploy folder.**

## 3. Database (utf8mb4, InnoDB, foreign keys on)
```
admin_users(id, email UNIQUE, username UNIQUE, password_hash, created_at, last_login_at)
sessions(id, user_id FK, token_hash UNIQUE, expires_at, ip, user_agent, created_at)

site_settings(id=1, projects_heading, updated_at)
home_content(id=1, body_json JSON, body_html MEDIUMTEXT, sign_off VARCHAR, updated_at)
cta_links(id, label, url, sort_order, is_active)
footer_settings(id=1, year_mode ENUM('auto','fixed'), fixed_year NULL, copyright_text,
                designed_by_text, designer_name, designer_url, updated_at)

categories(id, slug UNIQUE, name, content_type ENUM('project','paper'), sort_order, is_active)

media(id, kind ENUM('image','video'), original_name, stored_name UNIQUE, relative_path,
      mime, size_bytes, width NULL, height NULL, duration_s NULL, alt NULL, created_at)

projects(id, slug UNIQUE, title, pub_year SMALLINT NOT NULL, pub_month TINYINT NULL, pub_day TINYINT NULL,
         category_id FK, primary_media_id FK NULL, poster_media_id FK NULL,
         project_url NULL, link_label NULL, summary TEXT,
         paragraph_1 MEDIUMTEXT, paragraph_2 MEDIUMTEXT, paragraph_3 MEDIUMTEXT,
         status ENUM('draft','published'), sort_order, published_at NULL, created_at, updated_at)
project_gallery(id, project_id FK ON DELETE CASCADE, media_id FK, caption NULL, sort_order)

papers(id, slug UNIQUE, title, pub_year SMALLINT NOT NULL, pub_month NULL, pub_day NULL,
       category_id FK, summary TEXT NULL, cover_media_id FK NULL,
       content_json JSON, content_html MEDIUMTEXT,
       status ENUM('draft','published'), published_at NULL, created_at, updated_at)
paper_media(paper_id FK, media_id FK, PRIMARY KEY(paper_id, media_id))   -- usage tracking
slug_history(id, entity ENUM('project','paper'), entity_id, slug, created_at)  -- old slugs redirect
```
Decisions:
- Papers is a **separate content type** but is exposed through a category of `content_type='paper'`, so the home switcher lists it like any category. Categories are never hardcoded; deleting a category with items is blocked until they're reassigned.
- Year is required, month/day nullable (day requires month). Display: year only, "March 2025", or "March 12, 2025".
- "Max 10 gallery images" is enforced in the service layer (and validated again on upload).
- `content_json` (TipTap/ProseMirror JSON) is the source of truth for papers and for the home intro; `content_html` is a **sanitized render cache** regenerated on every save, so public pages need no editor code.

## 4. Rich text and media (the "video bug" fix)
Never store file-system paths in content. The editor stores **media IDs**:
```
{ "type": "image", "attrs": { "mediaId": 42, "caption": "..." } }
{ "type": "video", "attrs": { "mediaId": 43, "caption": "..." } }
```
1. Admin uploads the file to `POST /admin/media` → backend validates, stores, inserts a `media` row, returns `{ id, kind, url, width, height }`.
2. Editor inserts a node with `mediaId` and displays `url` (resolved, not persisted).
3. On save, backend walks the JSON, collects `mediaId`s into `paper_media`, and renders `content_html` by resolving each ID to a public URL (`<video controls playsinline preload="metadata" poster=…>` / `<img width height>`).
4. On read, the API returns JSON with every media node enriched with `src`, plus `content_html`. Changing the public base URL later needs no content migration.
5. Links in text are `link` marks with `href` (validated `http(s)`/`mailto`), stored in the JSON and rendered as `<a>`. Home intro uses the same pipeline.
Saved → API read → render round trip must be lossless; this is covered by tests (§9).

Three kinds of address, never mixed: **filesystem path** (server only, `MEDIA_STORAGE_DIR` + `relative_path`), **DB reference** (`media.id`), **public URL** (always `/media/<relative_path>`, built at read time by `buildPublicMediaUrl`).

## 5. Storage and persistence on Hostinger
- Files live in `MEDIA_STORAGE_DIR` (`UPLOAD_DIR` is only a deprecated alias), a directory **outside** the Git checkout and outside the build output that Hostinger replaces on deploy (I could not verify how `hbuild` behaves; see the check below). Example shape: `<account-home>/storage/uploads/YYYY/MM/<uuid>.<ext>`.
- Express serves them from `GET /media/*` with range requests (video seeking), `Cache-Control: public, max-age=31536000, immutable` (names are unique), `X-Content-Type-Options: nosniff`.
- `MEDIA_STORAGE_DIR` is a required env var because the correct absolute path differs per account and must not be derived from the app folder. On boot the app **fails fast** if it doesn't exist, isn't writable, or resolves inside the app directory.
- Deploy check (do this once, before launch): upload a test image, run two successive redeploys (including a rebuild), confirm the file and its DB row still serve. Also confirm the folder is included in Hostinger backups.
- Database persists independently (MySQL service); migrations are additive and never drop data.
- Storage sits behind a small driver interface (`save/delete/stream/stat`) so object storage can replace disk later.

## 6. Upload validation
- Images: JPG/JPEG, PNG, WebP, ≤ 10 MB. Videos: MP4, WebM, MOV, ≤ 200 MB (limits in config; Hostinger request limits may force lower, test it).
- Check extension **and** magic bytes (`file-type`), not just `Content-Type`. Reject mismatches.
- Filenames are generated (uuid); original name kept only in the DB. Dimensions read with `sharp`; video duration only if `ffprobe` exists, otherwise null.
- MOV may not play in all browsers and there's likely no ffmpeg on shared Node hosting. The admin shows a warning for MOV and recommends MP4 (H.264). Don't promise transcoding.
- Uploads stream to a temp file then move; partial files are removed on failure. Deleting a project, gallery item, or paper removes unreferenced `media` rows and their files.

## 7. Authentication
- No registration route exists. The first admin is created with `npm run admin:create` (prompts for email/username/password in the terminal on the server or locally against the prod DB). No credentials in code, seed files, UI or docs.
- Argon2id hashing. Login → random 32-byte token, only its SHA-256 stored in `sessions`; sent as `HttpOnly; Secure; SameSite=Lax` cookie, 7-day expiry, rotated on login. Logout deletes the row.
- Rate limit login (5 / 15 min / IP+account), generic error message, constant-time compare.
- CSRF: state-changing admin requests require an `X-CSRF-Token` obtained from `GET /admin/auth/me`, plus Origin check against allowed origins.
- All `/api/v1/admin/*` routes behind `requireAuth`. Public routes read only `published` rows.
- Helmet, strict CORS (site + admin origin), parameterized SQL only, body size limits, sanitize-html on HTML output.

## 8. API (`/api/v1`)
**Public (read-only, published only)**
`GET /home` (intro html+json, sign_off, cta_links, projects_heading, categories) · `GET /categories` · `GET /items?category=slug` (merged projects + papers, sorted by date desc then sort_order) · `GET /projects/:slug` · `GET /papers/:slug` · `GET /footer` · `GET /sitemap` · `GET /media/*` (not under /api)

**Admin auth**: `POST /admin/auth/login` · `POST /admin/auth/logout` · `GET /admin/auth/me` · `POST /admin/auth/password`

**Admin CMS**: `GET|PUT /admin/home` · `GET|PUT /admin/cta` (full ordered list replace) · `GET|PUT /admin/site-settings` · `GET|PUT /admin/footer`

**Categories**: `GET|POST /admin/categories` · `PUT|DELETE /admin/categories/:id` · `PUT /admin/categories/reorder`

**Projects**: `GET|POST /admin/projects` · `GET|PUT|DELETE /admin/projects/:id` · `POST /admin/projects/:id/publish|unpublish` · `PUT /admin/projects/reorder`
**Gallery**: `POST /admin/projects/:id/gallery` (upload) · `PUT /admin/projects/:id/gallery/:itemId` (caption) · `DELETE …/:itemId` · `PUT …/gallery/reorder`

**Papers**: `GET|POST /admin/papers` · `GET|PUT|DELETE /admin/papers/:id` · `POST /admin/papers/:id/publish|unpublish`
**Media**: `POST /admin/media` (multipart: image or video) · `GET /admin/media` · `DELETE /admin/media/:id` (blocked if referenced)
**Dashboard**: `GET /admin/stats` (counts computed by SQL: projects total/published/draft, per category, papers, categories, media count/size, recent updates, items needing attention)

Responses: `{ data }` on success, `{ error: { code, message, fields? } }` on failure; proper HTTP status codes.

## 9. Slugs
Generated from the title (lowercase, hyphenated, ASCII-folded); unique with `-2`, `-3` suffixes. Editable in the form. When a published slug changes, the old slug is saved to `slug_history` and the public route 301-redirects to the new one.

## 10. Frontend integration
- Existing public design unchanged; components consume the API instead of seed data. Home intro renders `body_html` (already sanitized) so embedded links survive.
- Admin lives under `/admin` in the same Next.js app (avoids a third Hostinger app), `robots: noindex`, excluded from the sitemap.
- After admin saves, the API calls `POST {SITE_URL}/api/revalidate` with a secret so public pages refresh immediately.

## 11. Environment variables (only what's required)
`NODE_ENV` · `PORT` · `DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME` · `MEDIA_STORAGE_DIR` · `SITE_URL` · `ADMIN_ORIGIN` (if different) · `SESSION_COOKIE_DOMAIN` (only if site and API share a parent domain) · `REVALIDATE_SECRET` · frontend: `NEXT_PUBLIC_API_URL`, `API_URL` (server-side). `.env` is gitignored; `.env.example` lists names only.

## 12. Testing before launch
Auth (login/logout/rate-limit/protected routes) · category CRUD + reorder + block-delete · project CRUD with year-only dates · primary image and video upload · gallery (add, caption, reorder, 10 cap, delete) · paper rich text round trip (bold, italic, link, heading, quote, image, video, text after media) · slug collisions and redirects · draft vs published visibility · video plays with seeking on the public page · two redeploys without losing media · DB reconnect behaviour.

## 13. Build order
Docs → migrations → auth + `admin:create` → storage/media API → CMS endpoints → categories → projects → papers/editor → admin UI → frontend integration → Hostinger deploy + persistence check → launch checklist.

## 14. Update: media, papers, background (latest)
- **One media system.** Every upload (profile images, project primary/poster/gallery, paper cover, paper inline) goes through `POST /api/v1/admin/media/upload` → `media` table → files in `MEDIA_STORAGE_DIR`. URLs are built in ONE place, `buildPublicMediaUrl()` in `media.service.ts`; profile images use it too. Missing files return a real 404 (no synthesized placeholders except the 4 demo-seed names).
- **Paper inline media** is resolved from the `media` table by `mediaId` on every read (`resolveInlineMedia` in `papers.service.ts`), so stale `src` values or old absolute paths stored in `content_html` can no longer break rendering.
- **Papers are a top-level work type.** No paper categories; `papers.category_id` is nullable and unused. Migration 005 deletes `categories` rows of type `paper` (papers, projects and media are untouched). Only project categories can be created.
- **Background mode.** `site_settings.background_mode` (`off_black` default | `black`) controls the dark-theme background; `app/layout.tsx` reads it from MySQL and sets `data-bg` on `<html>`. Noise is a separate fixed layer behind the content layer, so it never overlays the profile image.
- **DB engine.** MySQL only in production. The embedded SQLite fallback runs only when `NODE_ENV !== 'production'` or `ALLOW_SQLITE_FALLBACK=true`. `GET /api/v1/admin/media/storage-status` reports `dbEngine`.
- **Deploy order:** run `npm run migrate` (applies 005) before or together with the deploy.

## 15. Update: final media architecture
- **Persistent location:** `MEDIA_STORAGE_DIR` (default: `<account root>/media_uploads`, OUTSIDE `hbuilds/`). Never `hbuilds/**/public`: that folder is replaced on every deploy, and Next.js does not serve files added to `public/` after the build.
- **Logical folders inside it:** `project-media/{images,videos}`, `profile-media/images`, `paper-media/{images,videos}`. Older files (`images/…`, `videos/…`, legacy folders) are still found and copied in on first read.
- **One URL format:** `/media/<relative_path>` everywhere (admin, public, profile). `PUBLIC_MEDIA_URL` was removed because a wrong value made admin previews and the profile image break while the public site worked.
- **Uploads:** one client helper (`lib/admin-upload.ts`). Files ≤ 2 MB go in one request; larger files (videos) are uploaded in 2 MB chunks via `/api/v1/admin/media/chunk`, assembled on disk (never fully in memory), validated by file signature, then recorded in `media`. Errors are shown, not swallowed.
