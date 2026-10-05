# Hostinger Persistent Media Storage & Deployment Architecture

This document specifies the persistent media storage architecture designed specifically for **Hostinger Node.js deployments** to guarantee that user-uploaded images and videos survive new GitHub pushes, pull requests, rebuilds, and deployments.

---

## 1. The Hostinger Deployment Model

### Why files are lost if not configured properly
Hostinger's Git-connected Node.js web application manager uses a deployment-managed lifecycle:
- On each Git push or redeployment, Hostinger pulls the repository into a versioned build folder under `hbuilds/` (e.g., `hbuilds/build_hash/` or ephemeral working directories).
- It runs `npm install` and `npm run build`, and proxies traffic through `public_html/`.
- **Any files written inside `hbuilds/` or inside the application source tree (e.g., `./public/uploads` or `./uploads`) are transient and will be deleted whenever Hostinger rotates or rebuilds the deployment version.**

### The Correct Persistent Hierarchy
To ensure uploaded assets are permanent, media files are physically stored in a dedicated persistent directory **outside** both `hbuilds/` and `public_html/`:

```text
Hostinger User Home / Domain Root (/home/u123456789/)
├── domains/
│   └── yourdomain.com/
│       ├── hbuilds/                 <-- Transient: overwritten on new builds / Git pushes
│       │   └── 9a8b7c6d/            <-- Current application code build
│       │
│       ├── public_html/             <-- Deployment managed entrypoint / static cache
│       │
│       └── media_uploads/           <-- ✅ PERSISTENT: NEVER TOUCHED BY DEPLOYMENTS
│           ├── images/              <-- Project covers, gallery images, paper visuals
│           ├── videos/              <-- Project MP4/WebM videos
│           └── posters/             <-- Video preview poster stills
│
└── .env                             <-- Configures MEDIA_STORAGE_DIR to persistent path
```

---

## 2. Media Upload & Serving Architecture

```text
1. Admin Upload Flow:
   Admin UI (Hippo) 
        ↓ (multipart/form-data)
   /api/v1/admin/media/upload
        ↓ (MIME & magic bytes validation, Sharp metadata)
   Persistent Disk Storage (/home/u123456789/domains/yourdomain.com/media_uploads/images/...)
        ↓ (Insert record: original_name, stored_name, relative_path, mime, size, width, height)
   MySQL Database (`media` table)
        ↓
   Returns MediaRecord JSON with public_url: "/media/images/<uuid>.<ext>"

2. Public Browser Delivery Flow:
   Browser requests <img src="/media/images/<uuid>.webp"> or <video src="/media/videos/<uuid>.mp4">
        ↓
   Next.js Media Route Handler (/app/media/[...path]/route.ts)
        ↓
   Safe path resolution against MEDIA_STORAGE_DIR (with traversal protection)
        ↓
   Streams file with:
     • HTTP 206 Partial Content (Range requests for video seeking)
     • Cache-Control: public, max-age=31536000, immutable
     • ETag & 304 Not Modified validation
     • nosniff security headers
```

---

## 3. Database Metadata vs Filesystem Separation

The MySQL database remains the strict single source of truth for portfolio metadata and media references. The binary data is stored on disk, never as large binary blobs in MySQL.

### `media` Table Schema:
| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | Unique ID referenced by projects & papers | `42` |
| `kind` | `ENUM('image', 'video')` | Asset type classification | `'image'` |
| `original_name` | `VARCHAR(255)` | Original client filename | `'hero-banner.png'` |
| `stored_name` | `VARCHAR(255) UNIQUE` | Secure UUID filename on disk | `'a1b2c3d4-e5f6-7890.webp'` |
| `relative_path` | `VARCHAR(500)` | Relative path inside persistent storage | `'images/a1b2c3d4-e5f6-7890.webp'` |
| `mime` | `VARCHAR(100)` | Validated MIME type | `'image/webp'` |
| `size_bytes` | `BIGINT` | File size in bytes | `482910` |
| `width` | `INT NULL` | Image width extracted via Sharp | `1920` |
| `height` | `INT NULL` | Image height extracted via Sharp | `1080` |
| `duration_s` | `FLOAT NULL` | Video duration in seconds (if probed) | `14.5` |
| `alt` | `VARCHAR(255) NULL` | Accessibility caption & alt text | `'Architecture diagram'` |
| `created_at` | `TIMESTAMP` | Record timestamp | `2026-10-05 09:30:00` |

### Internal vs External Paths:
- **Never expose filesystem paths**: Internal server paths like `/home/u123456789/media_uploads/images/abc.webp` are strictly confined to the backend disk service and never leaked into API payloads or frontend markup.
- **Browser-accessible URLs**: The application generates clean, relative URLs (`/media/images/abc.webp`) that are routed through the application's streaming endpoint.

---

## 4. Hostinger Configuration & Environment Variables

Add the following environment variables in your Hostinger **Advanced > Environment Variables** (or `.env` file):

```env
# Persistent Storage Directory (OUTSIDE hbuilds and public_html)
MEDIA_STORAGE_DIR=/home/u123456789/domains/yourdomain.com/media_uploads

# Public Media URL Prefix
PUBLIC_MEDIA_URL=/media

# MySQL Credentials (Hostinger MySQL Database)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u123456789_dominion
DB_PASSWORD=your_secure_password
DB_NAME=u123456789_portfolio
```

### Auto-Detection Behavior
If `MEDIA_STORAGE_DIR` is not explicitly supplied in `.env`, the backend's storage engine automatically detects the Hostinger environment by reading the domain root path (looking for `/domains/{domain}/`) or `$HOME` directory and creates `media_uploads` outside `hbuilds` automatically.

---

## 5. Deployment Verification Checklist

To verify that the media persistence works across Hostinger deployments:

1. **Upload Test**:
   - Log into `/hippo` with your admin credentials (`raycassxxx@gmail.com` / `Dominion`).
   - Create a project or research paper, and upload a cover image and gallery video.
   - Confirm the public site (`/work/[slug]` or `/papers/[slug]`) displays the image and plays the video.

2. **Rebuild / Git Push Simulation**:
   - Make a code commit or trigger a new deployment in Hostinger Git Manager.
   - Allow Hostinger to perform a complete build (`npm run build`) in a new `hbuilds` folder.
   - Restart the Node.js application.

3. **Persistence Verification**:
   - Visit the public website: the image and video continue to load and stream with HTTP 200 / HTTP 206.
   - Inspect MySQL: the `media` table maintains all records and references intact.
   - Inspect the Hostinger File Manager: `/home/u123456789/domains/yourdomain.com/media_uploads/images` retains the physical files untouched.
