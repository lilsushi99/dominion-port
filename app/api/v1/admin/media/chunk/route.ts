// app/api/v1/admin/media/chunk/route.ts — Chunked upload (small requests, no whole-file memory buffering).
// Works behind proxies with request-size limits and handles large videos.
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifySession, verifyCsrfToken } from '@/backend/src/services/auth.service';
import { uploadMediaFromPath, MAX_VIDEO_SIZE_BYTES } from '@/backend/src/services/media.service';
import { resolveStoragePath } from '@/backend/src/storage/disk';

export const dynamic = 'force-dynamic';

const err = (code: string, message: string, status = 400) =>
  NextResponse.json({ error: { code, message } }, { status });

function tmpDir(): string {
  const dir = resolveStoragePath('.tmp');
  if (!dir) throw new Error('Storage path unavailable.');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupStale(dir: string) {
  try {
    const cutoff = Date.now() - 6 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const token = req.cookies.get('dominion_session')?.value || bearer;
  const session = token ? await verifySession(token) : null;
  if (!token || !session) return err('UNAUTHORIZED', 'Authentication required.', 401);
  if (!bearer && !verifyCsrfToken(token, req.headers.get('x-csrf-token') || '')) {
    return err('CSRF_INVALID', 'Invalid or missing CSRF token.', 403);
  }

  const h = (n: string) => req.headers.get(n) || '';
  const uploadId = h('x-upload-id');
  const offset = Number(h('x-offset'));
  const totalSize = Number(h('x-file-size'));
  const isFinal = h('x-final') === '1';
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(uploadId) || !Number.isFinite(offset) || !Number.isFinite(totalSize)) {
    return err('VALIDATION_ERROR', 'Invalid chunk headers.');
  }
  if (totalSize > MAX_VIDEO_SIZE_BYTES) return err('VALIDATION_ERROR', 'File exceeds the 200 MB limit.');

  try {
    const dir = tmpDir();
    const part = path.join(dir, `${uploadId}.part`);

    if (offset === 0) {
      cleanupStale(dir);
      fs.writeFileSync(part, Buffer.alloc(0));
    }
    const current = fs.existsSync(part) ? fs.statSync(part).size : -1;
    if (current !== offset) return err('CHUNK_OUT_OF_ORDER', `Expected offset ${current}, got ${offset}.`, 409);

    const chunk = Buffer.from(await req.arrayBuffer());
    if (offset + chunk.length > totalSize) {
      fs.rmSync(part, { force: true });
      return err('VALIDATION_ERROR', 'Chunk exceeds declared file size.');
    }
    fs.appendFileSync(part, chunk);

    if (!isFinal) return NextResponse.json({ data: { received: offset + chunk.length } });

    if (fs.statSync(part).size !== totalSize) {
      fs.rmSync(part, { force: true });
      return err('INCOMPLETE_UPLOAD', 'Uploaded size does not match the file size.');
    }
    try {
      const media = await uploadMediaFromPath(
        part,
        decodeURIComponent(h('x-file-name') || 'upload'),
        h('x-file-type'),
        decodeURIComponent(h('x-alt') || ''),
        h('x-purpose') || null
      );
      return NextResponse.json({ data: media }, { status: 201 });
    } catch (e: any) {
      fs.rmSync(part, { force: true });
      return err('UPLOAD_FAILED', e.message || 'Media upload failed.');
    }
  } catch (e: any) {
    console.error('[API MEDIA CHUNK ERROR]', e);
    return err('UPLOAD_FAILED', e.message || 'Chunk upload failed.', 500);
  }
}
