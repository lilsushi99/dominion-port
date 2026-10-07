// backend/src/storage/disk.ts — Persistent Disk Storage Engine with Range Request Support
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface FileRangeInfo {
  start: number;
  end: number;
  chunkSize: number;
  totalSize: number;
  stream: fs.ReadStream;
}

/**
 * The single persistent media directory (MEDIA_STORAGE_DIR). It must live OUTSIDE the
 * Git checkout / hbuilds so deployments never touch it.
 */
function storageRoot(): string {
  return path.resolve(env.MEDIA_STORAGE_DIR);
}

/**
 * Initializes the persistent upload directory structure.
 */
export function ensureUploadDirs(): void {
  const baseDir = storageRoot();
  for (const dir of [baseDir, path.join(baseDir, 'images'), path.join(baseDir, 'videos'), path.join(baseDir, 'posters')]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Normalizes a stored/legacy media reference into a clean path relative to the storage root.
 * Handles legacy values such as "/media/images/x.png", "uploads/x.png" or an absolute
 * ".../media_uploads/images/x.png" path that older code stored in the database.
 */
export function normalizeRelativePath(raw: string): string {
  let p = String(raw || '').trim().replace(/\\/g, '/');
  const idx = p.lastIndexOf('media_uploads/');
  if (idx !== -1) p = p.slice(idx + 'media_uploads/'.length);
  p = p.replace(/^\/+/, '');
  for (const prefix of ['media_uploads/', 'uploads/', 'media/']) {
    if (p.startsWith(prefix)) p = p.slice(prefix.length);
  }
  return p;
}

/**
 * Safe absolute path INSIDE the storage root for a (possibly not yet existing) relative path.
 * Returns null on traversal attempts. Used for writes and as the base of reads.
 */
export function resolveStoragePath(relativePath: string): string | null {
  const root = storageRoot();
  const clean = normalizeRelativePath(relativePath);
  if (!clean) return null;
  const target = path.resolve(root, clean);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}


/**
 * Folders that older versions of the app wrote to or searched. They are READ-ONLY fallbacks:
 * when a file is found there it is copied into the main storage folder, so after one
 * visit/scan everything lives in MEDIA_STORAGE_DIR. Configure extra ones with
 * MEDIA_LEGACY_DIRS (comma-separated absolute paths).
 */
export function getLegacyDirs(): string[] {
  const cwd = process.cwd();
  const root = storageRoot();
  const raw = [
    process.env.UPLOAD_DIR,
    ...String(process.env.MEDIA_LEGACY_DIRS || '').split(','),
    '/home/u475835399/domains/brandoai.online/media_uploads',
    '/home/u475835399/domains/BrandoAI.online/media_uploads',
    '/home/u475835399/media_uploads',
    path.resolve(cwd, 'media_uploads'),
    path.resolve(cwd, '../media_uploads'),
    path.resolve(cwd, '../../media_uploads'),
    path.resolve(cwd, '../persistent_media_uploads'),
    path.resolve(cwd, 'persistent_media_uploads'),
  ]
    .map((d) => (d || '').trim())
    .filter(Boolean)
    .map((d) => path.resolve(d));
  return Array.from(new Set(raw)).filter((d) => d !== root && fs.existsSync(d));
}

function mediaSubfolderFor(relative: string, baseName: string): string {
  const top = relative.split('/')[0];
  if (['images', 'videos', 'posters'].includes(top)) return top;
  return /\.(mp4|webm|mov|m4v)$/i.test(baseName) ? 'videos' : 'images';
}

/** Looks for a file in the legacy folders and copies it into the main storage folder. */
function adoptFromLegacyDirs(relativePath: string): string | null {
  const root = storageRoot();
  const clean = normalizeRelativePath(relativePath);
  const baseName = path.basename(clean);
  if (!clean || !baseName) return null;
  const isFile = (p: string) => fs.existsSync(p) && !fs.statSync(p).isDirectory();

  for (const dir of getLegacyDirs()) {
    const candidates = [path.resolve(dir, clean), path.join(dir, baseName), path.join(dir, 'images', baseName), path.join(dir, 'videos', baseName), path.join(dir, 'posters', baseName)]
      .filter((c) => c === dir || c.startsWith(dir + path.sep));
    for (const cand of candidates) {
      if (!isFile(cand)) continue;
      try {
        const sub = mediaSubfolderFor(clean, baseName);
        const dest = path.join(root, sub, baseName);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (!fs.existsSync(dest)) fs.copyFileSync(cand, dest);
        console.log(`[STORAGE] Adopted legacy file into main storage: ${cand} -> ${dest}`);
        return dest;
      } catch (err) {
        console.warn(`[STORAGE] Could not copy ${cand} into main storage, serving it in place:`, err);
        return cand;
      }
    }
  }
  return null;
}

// Demo rows created by 002_seed_initial_data.sql point at files that were never uploaded.
// Only these exact names get a generated placeholder; everything else is a real 404.
const SEED_PLACEHOLDER_NAMES = new Set(['sample-video.mp4', 'sample-poster.svg', 'sample-thumb.svg', 'article-figure.svg']);

/**
 * Resolves an EXISTING file for reading: the main storage folder first, then the legacy
 * folders (see getLegacyDirs), copying anything found there into the main folder.
 * Returns null when the file does not exist, so callers answer 404 instead of faking content.
 */
export function getSafeFilePath(relativePath: string): string | null {
  const primary = resolveStoragePath(relativePath);
  if (!primary) return null;

  const isFile = (p: string) => fs.existsSync(p) && !fs.statSync(p).isDirectory();
  if (isFile(primary)) return primary;

  const root = storageRoot();
  const baseName = path.basename(primary);
  for (const sub of ['images', 'videos', 'posters']) {
    const cand = path.join(root, sub, baseName);
    if (isFile(cand)) return cand;
  }

  const adopted = adoptFromLegacyDirs(relativePath);
  if (adopted) return adopted;

  if (SEED_PLACEHOLDER_NAMES.has(baseName)) {
    return ensureSeedPlaceholder(primary, baseName);
  }

  return null;
}

function ensureSeedPlaceholder(target: string, baseName: string): string | null {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (baseName.endsWith('.svg')) {
      const label = baseName.replace(/\.svg$/, '').replace(/[-_]/g, ' ');
      fs.writeFileSync(
        target,
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="#1c1b22"/><text x="600" y="375" fill="#8f8e89" font-family="system-ui,sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
        'utf-8'
      );
      return target;
    }
    if (baseName.endsWith('.mp4')) {
      const { execFileSync } = require('child_process');
      execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=black:s=1280x720:d=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', target], { stdio: 'ignore' });
      return fs.existsSync(target) ? target : null;
    }
  } catch (err) {
    console.warn(`[STORAGE] Could not create seed placeholder ${target}:`, err);
  }
  return null;
}

/**
 * Saves a file buffer to persistent disk storage.
 */
export async function saveFileToDisk(relativePath: string, data: Buffer): Promise<string> {
  ensureUploadDirs();
  const safePath = resolveStoragePath(relativePath);
  if (!safePath) {
    throw new Error('Invalid or unsafe target file path.');
  }

  const dir = path.dirname(safePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await fs.promises.writeFile(safePath, data);
  return safePath;
}

/**
 * Deletes a file from persistent disk storage if it exists.
 */
export async function deleteFileFromDisk(relativePath: string): Promise<boolean> {
  const safePath = getSafeFilePath(relativePath);
  if (!safePath || !fs.existsSync(safePath)) {
    return false;
  }

  try {
    await fs.promises.unlink(safePath);
    return true;
  } catch (err) {
    console.error(`[STORAGE] Failed to unlink file ${safePath}:`, err);
    return false;
  }
}

/**
 * Handles HTTP Range requests for video/media streaming.
 */
export function getStreamWithRange(
  relativePath: string,
  rangeHeader?: string | null
): { range?: FileRangeInfo; fullStream?: fs.ReadStream; totalSize: number; exists: boolean } {
  const safePath = getSafeFilePath(relativePath);
  if (!safePath || !fs.existsSync(safePath)) {
    return { exists: false, totalSize: 0 };
  }

  const stat = fs.statSync(safePath);
  const totalSize = stat.size;

  if (!rangeHeader) {
    return {
      exists: true,
      totalSize,
      fullStream: fs.createReadStream(safePath)
    };
  }

  // Parse Range: bytes=start-end
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

  if (isNaN(start) || start >= totalSize || end >= totalSize || start > end) {
    return {
      exists: true,
      totalSize,
      fullStream: fs.createReadStream(safePath)
    };
  }

  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(safePath, { start, end });

  return {
    exists: true,
    totalSize,
    range: {
      start,
      end,
      chunkSize,
      totalSize,
      stream
    }
  };
}
