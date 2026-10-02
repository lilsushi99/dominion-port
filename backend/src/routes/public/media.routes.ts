// backend/src/routes/public/media.routes.ts — Range-Request Media Streaming
import { Router, Request, Response } from 'express';
import mime from 'mime-types';
import { getStreamWithRange } from '../../storage/disk';

export const publicMediaRouter = Router();

/**
 * GET /media/*
 * Serves media files with Range requests (206 Partial Content), caching, and security headers.
 */
publicMediaRouter.get('/*', (req: Request, res: Response) => {
  const relativePath = req.params[0] || (req.path.startsWith('/') ? req.path.slice(1) : req.path);
  const rangeHeader = req.headers.range;

  const result = getStreamWithRange(relativePath, rangeHeader);

  if (!result.exists) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media file not found.' } });
    return;
  }

  const contentType = mime.lookup(relativePath) || 'application/octet-stream';

  // Security and Caching Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Accept-Ranges', 'bytes');

  if (result.range) {
    const { start, end, chunkSize, totalSize, stream } = result.range;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  } else if (result.fullStream) {
    res.status(200);
    res.setHeader('Content-Length', result.totalSize);
    res.setHeader('Content-Type', contentType);
    result.fullStream.pipe(res);
  }
});
