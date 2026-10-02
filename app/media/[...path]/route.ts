// app/media/[...path]/route.ts — HTTP Range-Request Video and Media Streaming
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { Readable } from 'stream';
import mime from 'mime-types';
import { getSafeFilePath } from '@/backend/src/storage/disk';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = segments.join('/');
  const safePath = getSafeFilePath(relativePath);

  if (!safePath || !fs.existsSync(safePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const stat = fs.statSync(safePath);
  const totalSize = stat.size;
  const contentType = mime.lookup(safePath) || 'application/octet-stream';
  const rangeHeader = req.headers.get('range');

  const headers: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff'
  };

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

  // Full file streaming
  const fileStream = fs.createReadStream(safePath);
  const webStream = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;
  headers['Content-Length'] = totalSize.toString();

  return new NextResponse(webStream, {
    status: 200,
    headers
  });
}
