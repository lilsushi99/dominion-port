// backend/src/services/media.service.ts — Media Management & Validation
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { saveFileToDisk, deleteFileFromDisk, normalizeRelativePath } from '../storage/disk';

export interface MediaRecord {
  id: number;
  kind: 'image' | 'video';
  original_name: string;
  stored_name: string;
  relative_path: string;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_s: number | null;
  alt: string | null;
  created_at: string;
  public_url: string;
  usage_count?: number;
}

export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime'
]);

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * Validates buffer magic bytes against declared MIME type to prevent spoofing.
 */
export function validateMagicBytes(buffer: Buffer, declaredMime: string): { valid: boolean; detectedMime?: string } {
  if (buffer.length < 4) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: declaredMime === 'image/jpeg', detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: declaredMime === 'image/png', detectedMime: 'image/png' };
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: declaredMime === 'image/gif', detectedMime: 'image/gif' };
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: declaredMime === 'image/webp', detectedMime: 'image/webp' };
  }

  // WebM: 1A 45 DF A3 (EBML header)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { valid: declaredMime === 'video/webm', detectedMime: 'video/webm' };
  }

  // MP4 / MOV: Check for 'ftyp' at offset 4
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    const isMov = brand.startsWith('qt');
    const detected = isMov ? 'video/quicktime' : 'video/mp4';
    return {
      valid: declaredMime === 'video/mp4' || declaredMime === 'video/quicktime',
      detectedMime: detected
    };
  }

  // SVG: Check for <svg tag in XML/text
  if (declaredMime === 'image/svg+xml') {
    const textSample = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024)).toLowerCase();
    if (textSample.includes('<svg') || (textSample.includes('<?xml') && textSample.includes('<svg'))) {
      return { valid: true, detectedMime: 'image/svg+xml' };
    }
  }

  return { valid: false };
}

/**
 * Cleans a stored media reference to a path relative to the storage root
 * (strips legacy absolute filesystem prefixes). External http(s) URLs pass through.
 */
export function cleanRelativePath(rawPath: string): string {
  if (!rawPath) return '';
  const trimmed = String(rawPath).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return normalizeRelativePath(trimmed);
}

/**
 * THE one place that turns a stored media reference into a browser-accessible URL.
 * Never returns a filesystem path. Used for projects, galleries, papers AND profile images.
 */
export function buildPublicMediaUrl(rawPath?: string | null): string {
  const rel = cleanRelativePath(rawPath || '');
  if (!rel) return '';
  if (rel.startsWith('http://') || rel.startsWith('https://')) return rel;
  const base = env.PUBLIC_MEDIA_URL.replace(/\/+$/, '');
  return `${base}/${rel.replace(/^\/+/, '')}`;
}

/**
 * Normalizes a MediaRecord to include public URL.
 */
export function formatMediaRecord(row: any): MediaRecord {
  if (!row) return null as any;
  const raw = row.relative_path || row.stored_name || '';
  const relPath = cleanRelativePath(raw);
  const publicUrl = buildPublicMediaUrl(raw);

  return {
    id: row.id,
    kind: row.kind,
    original_name: row.original_name || '',
    stored_name: row.stored_name || '',
    relative_path: relPath,
    mime: row.mime || (row.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    size_bytes: Number(row.size_bytes || 0),
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    duration_s: row.duration_s ? Number(row.duration_s) : null,
    alt: row.alt || null,
    created_at: row.created_at,
    public_url: publicUrl,
    usage_count: row.usage_count !== undefined ? Number(row.usage_count) : undefined
  };
}

/**
 * Processes and uploads a single file buffer.
 */
export async function uploadMedia(
  fileBuffer: Buffer,
  originalFilename: string,
  declaredMime: string,
  altText?: string
): Promise<MediaRecord> {
  const isImage = ALLOWED_IMAGE_MIMES.has(declaredMime);
  const isVideo = ALLOWED_VIDEO_MIMES.has(declaredMime);

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${declaredMime}. Allowed types: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, QuickTime.`);
  }

  // Size limit validation
  const sizeBytes = fileBuffer.length;
  if (isImage && sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image exceeds maximum allowed size of 10 MB (provided: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB).`);
  }
  if (isVideo && sizeBytes > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`Video exceeds maximum allowed size of 200 MB (provided: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB).`);
  }

  // Magic bytes inspection
  const magicResult = validateMagicBytes(fileBuffer, declaredMime);
  if (!magicResult.valid) {
    throw new Error(`File signature does not match declared type '${declaredMime}'. Upload rejected.`);
  }

  const kind: 'image' | 'video' = isImage ? 'image' : 'video';
  const ext = path.extname(originalFilename).toLowerCase() || (isImage ? '.webp' : '.mp4');
  const storedName = `${uuidv4()}${ext}`;
  const subFolder = isImage ? 'images' : 'videos';
  const relativePath = `${subFolder}/${storedName}`;

  // Image metadata extraction via sharp
  let width: number | null = null;
  let height: number | null = null;

  if (isImage && declaredMime !== 'image/svg+xml') {
    try {
      const meta = await sharp(fileBuffer).metadata();
      width = meta.width || null;
      height = meta.height || null;
    } catch (err) {
      console.warn('[MEDIA] Failed to extract image dimensions:', err);
    }
  }

  // Write file to disk outside repo
  await saveFileToDisk(relativePath, fileBuffer);

  // Insert record into MySQL
  const [result] = await pool.query<any>(
    `INSERT INTO media (kind, original_name, stored_name, relative_path, mime, size_bytes, width, height, duration_s, alt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      kind,
      originalFilename,
      storedName,
      relativePath,
      declaredMime,
      sizeBytes,
      width,
      height,
      null, // duration can be extracted if ffprobe available
      altText || null
    ]
  );

  const insertedId = result.insertId;
  const [rows] = await pool.query<any[]>('SELECT * FROM media WHERE id = ?', [insertedId]);

  return formatMediaRecord(rows[0]);
}

/**
 * Lists media items with pagination, filtering, and usage counts.
 */
export async function listMedia(options: {
  kind?: 'image' | 'video';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: MediaRecord[]; total: number }> {
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  const conditions: string[] = [];
  const params: any[] = [];

  if (options.kind) {
    conditions.push('m.kind = ?');
    params.push(options.kind);
  }

  if (options.search) {
    conditions.push('(m.original_name LIKE ? OR m.alt LIKE ?)');
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const [countRows] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM media m ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  // Query media with reference counting across projects, gallery, papers
  const [rows] = await pool.query<any[]>(
    `SELECT m.*,
       (
         (SELECT COUNT(*) FROM projects p WHERE p.primary_media_id = m.id OR p.poster_media_id = m.id) +
         (SELECT COUNT(*) FROM project_gallery pg WHERE pg.media_id = m.id) +
         (SELECT COUNT(*) FROM papers pap WHERE pap.cover_media_id = m.id) +
         (SELECT COUNT(*) FROM paper_media pm WHERE pm.media_id = m.id)
       ) as usage_count
     FROM media m
     ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows.map(formatMediaRecord),
    total
  };
}

/**
 * Gets a single media record by ID.
 */
export async function getMediaById(id: number): Promise<MediaRecord | null> {
  const [rows] = await pool.query<any[]>('SELECT * FROM media WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return formatMediaRecord(rows[0]);
}

/**
 * Updates media alt text.
 */
export async function updateMediaAlt(id: number, alt: string): Promise<MediaRecord | null> {
  await pool.query('UPDATE media SET alt = ? WHERE id = ?', [alt, id]);
  return getMediaById(id);
}

/**
 * Checks all references to a media item for deletion safety.
 */
export async function checkMediaReferences(id: number): Promise<string[]> {
  const references: string[] = [];

  // Check projects primary / poster
  const [projRows] = await pool.query<any[]>(
    'SELECT title, id FROM projects WHERE primary_media_id = ? OR poster_media_id = ?',
    [id, id]
  );
  for (const p of projRows) {
    references.push(`Project: ${p.title} (Primary/Poster)`);
  }

  // Check project gallery
  const [galRows] = await pool.query<any[]>(
    `SELECT p.title FROM project_gallery pg
     JOIN projects p ON pg.project_id = p.id
     WHERE pg.media_id = ?`,
    [id]
  );
  for (const g of galRows) {
    references.push(`Project Gallery: ${g.title}`);
  }

  // Check papers cover
  const [papRows] = await pool.query<any[]>(
    'SELECT title FROM papers WHERE cover_media_id = ?',
    [id]
  );
  for (const pap of papRows) {
    references.push(`Paper Cover: ${pap.title}`);
  }

  // Check paper media usage
  const [papMediaRows] = await pool.query<any[]>(
    `SELECT p.title FROM paper_media pm
     JOIN papers p ON pm.paper_id = p.id
     WHERE pm.media_id = ?`,
    [id]
  );
  for (const pm of papMediaRows) {
    references.push(`Paper Body Media: ${pm.title}`);
  }

  return references;
}

/**
 * Safely deletes a media item. Throws an error if references exist.
 */
export async function deleteMediaSafely(id: number): Promise<{ success: boolean; references?: string[] }> {
  const references = await checkMediaReferences(id);
  if (references.length > 0) {
    return { success: false, references };
  }

  const media = await getMediaById(id);
  if (!media) {
    return { success: false };
  }

  // Delete from disk
  await deleteFileFromDisk(media.relative_path);

  // Delete from database
  await pool.query('DELETE FROM media WHERE id = ?', [id]);

  return { success: true };
}
