// app/media/[...path]/route.ts — High-Performance Streaming Media Server with Range Requests & Cache
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { Readable } from 'stream';
import mime from 'mime-types';
import crypto from 'crypto';
import { getSafeFilePath } from '@/backend/src/storage/disk';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const relativePath = segments.join('/');
  const safePath = getSafeFilePath(relativePath);

  if (!safePath || !fs.existsSync(safePath)) {
    return new NextResponse('File Not Found', { status: 404 });
  }

  try {
    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const totalSize = stat.size;
    const contentType = mime.lookup(safePath) || 'application/octet-stream';
    const etag = `"${crypto.createHash('md5').update(`${stat.mtimeMs}-${stat.size}`).digest('hex')}"`;
    const lastModified = new Date(stat.mtimeMs).toUTCString();

    // Check Conditional GET (ETag / If-Modified-Since)
    const ifNoneMatch = req.headers.get('if-none-match');
    const ifModifiedSince = req.headers.get('if-modified-since');

    if (ifNoneMatch === etag || (ifModifiedSince && new Date(ifModifiedSince) >= new Date(stat.mtimeMs))) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Last-Modified': lastModified,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
      'Last-Modified': lastModified
    };

    // Range Request for video seeking / audio streaming
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && start < totalSize && end < totalSize && start <= end) {
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(safePath, { start, end });
        const webStream = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;

        headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
        headers['Content-Length'] = chunkSize.toString();

        return new NextResponse(webStream, {
          status: 206,
          headers
        });
      }
    }

    // Full File Streaming
    const fileStream = fs.createReadStream(safePath);
    const webStream = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;
    headers['Content-Length'] = totalSize.toString();

    return new NextResponse(webStream, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error(`[MEDIA ROUTE ERROR] Failed to stream ${safePath}:`, err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
