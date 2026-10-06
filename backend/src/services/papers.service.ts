// backend/src/services/papers.service.ts — Full Papers Service with Media Tracking & Slug History
import { pool } from '../db/pool';
import { generateSlug, recordSlugHistory, isSlugInUse } from './slug.service';
import { formatMediaRecord, MediaRecord } from './media.service';

export interface PaperRecord {
  id: number;
  slug: string;
  title: string;
  pub_year: number;
  pub_month: number | null;
  pub_day: number | null;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  summary: string | null;
  cover_media_id: number | null;
  cover_media?: MediaRecord | null;
  content_json: any;
  content_html: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  media_ids?: number[];
}

export interface PaperPayload {
  title: string;
  slug?: string;
  pub_year: number;
  pub_month?: number | null;
  pub_day?: number | null;
  category_id: number;
  summary?: string | null;
  cover_media_id?: number | null;
  content_json: any;
  content_html: string;
  status?: 'draft' | 'published';
}

/**
 * Extract all mediaId numbers from TipTap JSON tree
 */
export function extractMediaIdsFromTipTapJson(node: any): number[] {
  const ids = new Set<number>();
  function traverse(n: any) {
    if (!n) return;
    if (n.type === 'imageMediaNode' || n.type === 'videoMediaNode' || n.type === 'paperMedia') {
      const mediaId = Number(n.attrs?.mediaId || n.attrs?.media_id);
      if (mediaId && !isNaN(mediaId)) {
        ids.add(mediaId);
      }
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(traverse);
    }
  }
  traverse(node);
  return Array.from(ids);
}

/**
 * Syncs the paper_media tracking table so safe deletion works for media used in papers.
 */
async function syncPaperMedia(connection: any, paperId: number, mediaIds: number[]) {
  await connection.query('DELETE FROM paper_media WHERE paper_id = ?', [paperId]);
  if (mediaIds.length > 0) {
    const values = mediaIds.map((mId) => [paperId, mId]);
    await connection.query('INSERT IGNORE INTO paper_media (paper_id, media_id) VALUES ?', [values]);
  }
}

/**
 * Format raw SQL row to PaperRecord
 */
export function formatPaperRow(row: any): PaperRecord {
  let contentJson = row.content_json;
  if (typeof contentJson === 'string') {
    try {
      contentJson = JSON.parse(contentJson);
    } catch {
      contentJson = { type: 'doc', content: [] };
    }
  }

  const cover_media = row.cover_media_id
    ? formatMediaRecord({
        id: row.cover_media_id,
        kind: row.cover_kind || 'image',
        original_name: row.cover_original_name || '',
        stored_name: row.cover_stored_name || '',
        relative_path: row.cover_relative_path || '',
        mime: row.cover_mime || 'image/jpeg',
        size_bytes: row.cover_size_bytes || 0,
        width: row.cover_width,
        height: row.cover_height,
        duration_s: row.cover_duration_s,
        alt: row.cover_alt,
        created_at: ''
      })
    : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pub_year: row.pub_year,
    pub_month: row.pub_month,
    pub_day: row.pub_day,
    category_id: row.category_id || 4,
    category_name: 'papers',
    category_slug: 'papers',
    summary: row.summary,
    cover_media_id: row.cover_media_id,
    cover_media,
    content_json: contentJson,
    content_html: row.content_html,
    status: row.status,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

/**
 * List papers with optional filters
 */
export async function listPapers(options: {
  categorySlug?: string;
  status?: 'draft' | 'published';
  includeDrafts?: boolean;
}): Promise<PaperRecord[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (options.status) {
    whereClauses.push('pap.status = ?');
    params.push(options.status);
  } else if (!options.includeDrafts) {
    whereClauses.push('pap.status = "published"');
  }

  if (options.categorySlug && options.categorySlug !== 'all') {
    whereClauses.push('c.slug = ?');
    params.push(options.categorySlug);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      pap.*,
      c.name as category_name,
      c.slug as category_slug,
      cov.kind as cover_kind,
      cov.original_name as cover_original_name,
      cov.stored_name as cover_stored_name,
      cov.relative_path as cover_relative_path,
      cov.mime as cover_mime,
      cov.size_bytes as cover_size_bytes,
      cov.width as cover_width,
      cov.height as cover_height,
      cov.duration_s as cover_duration_s,
      cov.alt as cover_alt
    FROM papers pap
    LEFT JOIN categories c ON pap.category_id = c.id
    LEFT JOIN media cov ON pap.cover_media_id = cov.id
    ${whereSql}
    ORDER BY pap.pub_year DESC, pap.pub_month DESC, pap.pub_day DESC, pap.created_at DESC
  `;

  const [rows] = await pool.query<any[]>(sql, params);
  return rows.map(formatPaperRow);
}

/**
 * Get single paper by ID
 */
export async function getPaperById(id: number): Promise<PaperRecord | null> {
  const sql = `
    SELECT 
      pap.*,
      c.name as category_name,
      c.slug as category_slug,
      cov.kind as cover_kind,
      cov.original_name as cover_original_name,
      cov.stored_name as cover_stored_name,
      cov.relative_path as cover_relative_path,
      cov.mime as cover_mime,
      cov.size_bytes as cover_size_bytes,
      cov.width as cover_width,
      cov.height as cover_height,
      cov.duration_s as cover_duration_s,
      cov.alt as cover_alt
    FROM papers pap
    LEFT JOIN categories c ON pap.category_id = c.id
    LEFT JOIN media cov ON pap.cover_media_id = cov.id
    WHERE pap.id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query<any[]>(sql, [id]);
  if (rows.length === 0) return null;
  return formatPaperRow(rows[0]);
}

/**
 * Get single paper by Slug
 */
export async function getPaperBySlug(slug: string): Promise<PaperRecord | null> {
  const sql = `
    SELECT 
      pap.*,
      c.name as category_name,
      c.slug as category_slug,
      cov.kind as cover_kind,
      cov.original_name as cover_original_name,
      cov.stored_name as cover_stored_name,
      cov.relative_path as cover_relative_path,
      cov.mime as cover_mime,
      cov.size_bytes as cover_size_bytes,
      cov.width as cover_width,
      cov.height as cover_height,
      cov.duration_s as cover_duration_s,
      cov.alt as cover_alt
    FROM papers pap
    LEFT JOIN categories c ON pap.category_id = c.id
    LEFT JOIN media cov ON pap.cover_media_id = cov.id
    WHERE pap.slug = ?
    LIMIT 1
  `;

  const [rows] = await pool.query<any[]>(sql, [slug]);
  if (rows.length === 0) return null;
  return formatPaperRow(rows[0]);
}

/**
 * Create a new Paper with validation and media reference sync
 */
export async function createPaper(payload: PaperPayload): Promise<PaperRecord> {
  if (!payload.title || !payload.title.trim()) {
    throw new Error('Title is required for paper.');
  }
  if (!payload.pub_year) {
    throw new Error('Publication year is required.');
  }
  const categoryId = payload.category_id || 4;

  let finalSlug = payload.slug?.trim() ? generateSlug(payload.slug) : generateSlug(payload.title);
  let slugConflict = await isSlugInUse('paper', finalSlug);
  if (slugConflict) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  const publishedAt = payload.status === 'published' ? new Date() : null;
  const contentJsonStr = typeof payload.content_json === 'string'
    ? payload.content_json
    : JSON.stringify(payload.content_json || { type: 'doc', content: [] });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query<any>(
      `INSERT INTO papers (
        slug, title, pub_year, pub_month, pub_day, category_id, summary,
        cover_media_id, content_json, content_html, status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalSlug,
        payload.title.trim(),
        payload.pub_year,
        payload.pub_month || null,
        payload.pub_day || null,
        categoryId,
        payload.summary || null,
        payload.cover_media_id || null,
        contentJsonStr,
        payload.content_html || '',
        payload.status || 'draft',
        publishedAt
      ]
    );

    const newPaperId = result.insertId;

    // Sync media nodes
    const mediaIds = extractMediaIdsFromTipTapJson(payload.content_json);
    if (payload.cover_media_id && !mediaIds.includes(payload.cover_media_id)) {
      mediaIds.push(payload.cover_media_id);
    }
    await syncPaperMedia(connection, newPaperId, mediaIds);

    await connection.commit();
    return (await getPaperById(newPaperId))!;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Update an existing paper with 301 slug redirect logging
 */
export async function updatePaper(id: number, payload: Partial<PaperPayload>): Promise<PaperRecord> {
  const existing = await getPaperById(id);
  if (!existing) {
    throw new Error('Paper not found.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let newSlug = existing.slug;
    if (payload.slug && payload.slug.trim() && payload.slug.trim() !== existing.slug) {
      newSlug = generateSlug(payload.slug);
      const conflict = await isSlugInUse('paper', newSlug, id);
      if (conflict) {
        throw new Error(`The slug "${newSlug}" is already in use by another article.`);
      }
      await recordSlugHistory('paper', id, existing.slug);
    }

    const title = payload.title !== undefined ? payload.title.trim() : existing.title;
    const pubYear = payload.pub_year !== undefined ? payload.pub_year : existing.pub_year;
    const pubMonth = payload.pub_month !== undefined ? payload.pub_month : existing.pub_month;
    const pubDay = payload.pub_day !== undefined ? payload.pub_day : existing.pub_day;
    const categoryId = payload.category_id !== undefined ? payload.category_id : existing.category_id;
    const summary = payload.summary !== undefined ? payload.summary : existing.summary;
    const coverMediaId = payload.cover_media_id !== undefined ? payload.cover_media_id : existing.cover_media_id;
    const contentHtml = payload.content_html !== undefined ? payload.content_html : existing.content_html;
    const status = payload.status !== undefined ? payload.status : existing.status;

    let contentJsonStr = JSON.stringify(existing.content_json);
    if (payload.content_json !== undefined) {
      contentJsonStr = typeof payload.content_json === 'string'
        ? payload.content_json
        : JSON.stringify(payload.content_json);
    }

    let publishedAt = existing.published_at ? new Date(existing.published_at) : null;
    if (status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }

    await connection.query(
      `UPDATE papers SET
        slug = ?, title = ?, pub_year = ?, pub_month = ?, pub_day = ?, category_id = ?,
        summary = ?, cover_media_id = ?, content_json = ?, content_html = ?, status = ?, published_at = ?
       WHERE id = ?`,
      [
        newSlug,
        title,
        pubYear,
        pubMonth || null,
        pubDay || null,
        categoryId,
        summary || null,
        coverMediaId || null,
        contentJsonStr,
        contentHtml,
        status,
        publishedAt,
        id
      ]
    );

    // Sync media nodes
    const contentObj = payload.content_json !== undefined ? payload.content_json : existing.content_json;
    const mediaIds = extractMediaIdsFromTipTapJson(contentObj);
    if (coverMediaId && !mediaIds.includes(coverMediaId)) {
      mediaIds.push(coverMediaId);
    }
    await syncPaperMedia(connection, id, mediaIds);

    await connection.commit();
    return (await getPaperById(id))!;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Delete a paper
 */
export async function deletePaper(id: number): Promise<boolean> {
  const [result] = await pool.query<any>('DELETE FROM papers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Update paper status
 */
export async function updatePaperStatus(id: number, status: 'draft' | 'published'): Promise<PaperRecord> {
  return updatePaper(id, { status });
}
