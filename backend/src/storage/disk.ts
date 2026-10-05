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
 * Initializes the persistent upload directory structure.
 */
export function ensureUploadDirs(): void {
  const baseDir = env.MEDIA_STORAGE_DIR || env.UPLOAD_DIR;
  const dirs = [
    baseDir,
    path.join(baseDir, 'images'),
    path.join(baseDir, 'videos'),
    path.join(baseDir, 'posters')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Resolves a safe absolute path inside MEDIA_STORAGE_DIR preventing directory traversal.
 * Also checks seed/bundled assets and auto-migrates them into persistent storage.
 */
export function getSafeFilePath(relativePath: string): string | null {
  const baseDir = env.MEDIA_STORAGE_DIR || env.UPLOAD_DIR;
  const cleanRelative = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const targetPath = path.resolve(baseDir, cleanRelative);

  // Traversal protection
  if (!targetPath.startsWith(path.resolve(baseDir))) {
    return null;
  }

  // If file already exists in persistent storage, return it
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  // Check fallback static bundled seed assets (e.g. from /public/media or /public)
  const cwd = process.cwd();
  const seedCandidates = [
    path.resolve(cwd, 'public/media', cleanRelative),
    path.resolve(cwd, 'public', cleanRelative),
    path.resolve(cwd, 'public/media', path.basename(cleanRelative))
  ];

  for (const candidate of seedCandidates) {
    if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
      try {
        // Automatically sync initial seed assets into persistent storage
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(candidate, targetPath);
        return targetPath;
      } catch (err) {
        console.warn(`[STORAGE] Could not copy seed asset ${candidate} to ${targetPath}:`, err);
        return candidate;
      }
    }
  }

  return targetPath;
}

/**
 * Saves a file buffer to persistent disk storage.
 */
export async function saveFileToDisk(relativePath: string, data: Buffer): Promise<string> {
  ensureUploadDirs();
  const safePath = getSafeFilePath(relativePath);
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
