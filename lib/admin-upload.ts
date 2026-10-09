// lib/admin-upload.ts — ONE client upload helper for every admin screen.
// Small files use a single request; larger files (videos, big images) are sent in 2 MB chunks
// so they never hit proxy body limits or server memory limits.
export type UploadPurpose = 'project' | 'profile' | 'paper';

const CHUNK = 2 * 1024 * 1024;

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      res.status === 413
        ? 'The server rejected the upload as too large (413).'
        : `Upload failed (HTTP ${res.status}). The server did not return a valid response.`
    );
  }
}

export async function uploadMediaFile(
  file: File,
  opts: { csrfToken: string; alt?: string; purpose?: UploadPurpose; onProgress?: (pct: number) => void }
): Promise<any> {
  const { csrfToken, alt = '', purpose = 'project', onProgress } = opts;

  if (file.size <= CHUNK) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt', alt);
    fd.append('purpose', purpose);
    onProgress?.(10);
    const res = await fetch('/api/v1/admin/media/upload', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken }, body: fd });
    const json = await readJson(res);
    onProgress?.(100);
    if (!res.ok || !json.data) throw new Error(json.error?.message || 'File upload failed');
    return json.data;
  }

  const uploadId = (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  let offset = 0;
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK, file.size);
    const isFinal = end >= file.size;
    const res = await fetch('/api/v1/admin/media/chunk', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/octet-stream',
        'X-Upload-Id': uploadId,
        'X-Offset': String(offset),
        'X-File-Size': String(file.size),
        'X-File-Name': encodeURIComponent(file.name),
        'X-File-Type': file.type,
        'X-Alt': encodeURIComponent(alt),
        'X-Purpose': purpose,
        'X-Final': isFinal ? '1' : '0'
      },
      body: file.slice(offset, end)
    });
    const json = await readJson(res);
    if (!res.ok) throw new Error(json.error?.message || 'File upload failed');
    offset = end;
    onProgress?.(Math.round((offset / file.size) * 100));
    if (isFinal) return json.data;
  }
  throw new Error('Upload ended unexpectedly.');
}
