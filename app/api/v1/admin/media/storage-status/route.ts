// app/api/v1/admin/media/storage-status/route.ts — Hostinger Storage Diagnostics & Path Verification API
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifySession } from '@/backend/src/services/auth.service';
import { env } from '@/backend/src/config/env';
import { pool, getActiveDbEngine, sqliteFallbackAllowed } from '@/backend/src/db/pool';

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const cookieToken = req.cookies.get('dominion_session')?.value;
  const token = cookieToken || bearerToken;

  if (!token) return null;
  const sessionResult = await verifySession(token);
  if (!sessionResult) return null;

  return { user: sessionResult.user, token };
}

function countFilesAndBytes(dir: string): { count: number; bytes: number } {
  if (!fs.existsSync(dir)) return { count: 0, bytes: 0 };
  let count = 0;
  let bytes = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        count++;
        bytes += fs.statSync(fullPath).size;
      }
    }
  } catch (e) {
    console.error(`Error reading dir ${dir}:`, e);
  }

  return { count, bytes };
}

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  // Touch the DB so the active engine is known; surfaces a silent SQLite fallback.
  let dbEngine: string = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbEngine = getActiveDbEngine();
  } catch (e: any) {
    dbEngine = `unreachable: ${e?.message || e}`;
  }

  const cwd = process.cwd();
  const storageDir = env.MEDIA_STORAGE_DIR;

  let isWritable = false;
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    fs.accessSync(storageDir, fs.constants.W_OK | fs.constants.R_OK);
    isWritable = true;
  } catch {
    isWritable = false;
  }

  const isInsideHbuilds = storageDir.includes('/hbuilds') || storageDir.includes('\\hbuilds');
  const isInsidePublicHtml = storageDir.includes('/public_html') || storageDir.includes('\\public_html');
  const isInsideAppTree = storageDir.startsWith(cwd) && !storageDir.startsWith(path.resolve(cwd, '..'));

  const imagesDir = path.join(storageDir, 'images');
  const videosDir = path.join(storageDir, 'videos');
  const postersDir = path.join(storageDir, 'posters');

  const imagesStats = countFilesAndBytes(imagesDir);
  const videosStats = countFilesAndBytes(videosDir);
  const postersStats = countFilesAndBytes(postersDir);

  const totalFiles = imagesStats.count + videosStats.count + postersStats.count;
  const totalBytes = imagesStats.bytes + videosStats.bytes + postersStats.bytes;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  const warnings: string[] = [];

  if (!isWritable) {
    status = 'critical';
    warnings.push(`Storage path ${storageDir} is not writable. Check folder permissions.`);
  }

  if (isInsideHbuilds) {
    status = 'critical';
    warnings.push(
      'CRITICAL: Storage directory is inside hbuilds. Files will be deleted during next Hostinger deployment/build.'
    );
  } else if (isInsidePublicHtml) {
    status = 'warning';
    warnings.push(
      'WARNING: Storage directory is inside public_html. Hostinger deployment may overwrite files during new deployments.'
    );
  } else if (isInsideAppTree) {
    status = 'warning';
    warnings.push(
      'WARNING: Storage directory is inside the application repo tree. Set MEDIA_STORAGE_DIR to a path outside the repo.'
    );
  }

  if (dbEngine === 'sqlite-fallback') {
    status = 'critical';
    warnings.push('CRITICAL: Content is being read/written in the embedded SQLite fallback, NOT MySQL. Check DB_* settings.');
  }

  return NextResponse.json({
    data: {
      dbEngine,
      sqliteFallbackAllowed: sqliteFallbackAllowed(),
      status,
      runtimeCwd: cwd,
      mediaStorageDir: storageDir,
      publicUrlPrefix: env.PUBLIC_MEDIA_URL,
      isWritable,
      isInsideHbuilds,
      isInsidePublicHtml,
      isInsideAppTree,
      isPersistentSafe: !isInsideHbuilds && !isInsidePublicHtml && isWritable,
      stats: {
        imagesCount: imagesStats.count,
        videosCount: videosStats.count,
        postersCount: postersStats.count,
        totalFiles,
        totalBytes
      },
      warnings
    }
  });
}
