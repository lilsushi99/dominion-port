// lib/media-url.ts — Universal Media URL Normalizer for Browser Delivery
export function getSafeMediaUrl(rawPath?: string | null): string | null {
  if (!rawPath) return null;
  let p = String(rawPath).trim();
  if (!p) return null;

  if (p.startsWith('http://') || p.startsWith('https://')) {
    return p;
  }

  p = p.replace(/\\/g, '/');

  // Strip hostinger / linux filesystem absolute paths
  const mediaUploadsIdx = p.indexOf('media_uploads/');
  if (mediaUploadsIdx !== -1) {
    p = p.slice(mediaUploadsIdx + 'media_uploads/'.length);
  } else {
    const uploadsIdx = p.indexOf('uploads/');
    if (uploadsIdx !== -1) {
      p = p.slice(uploadsIdx + 'uploads/'.length);
    }
  }

  p = p.replace(/^\/+/, '');

  if (p.startsWith('media/')) {
    p = p.slice('media/'.length);
  }

  // Ensure clean /media/<relativePath>
  return `/media/${p}`;
}
