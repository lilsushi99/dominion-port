// backend/src/services/slug.service.ts — Slug Utilities and 301 Redirect History
import { pool } from '../db/pool';

/**
 * Generate a clean, lowercase URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check whether a slug is already taken by another entity
 */
export async function isSlugInUse(
  entity: 'project' | 'paper',
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const table = entity === 'project' ? 'projects' : 'papers';
  const query = excludeId
    ? `SELECT id FROM ${table} WHERE slug = ? AND id != ? LIMIT 1`
    : `SELECT id FROM ${table} WHERE slug = ? LIMIT 1`;
  const params = excludeId ? [slug, excludeId] : [slug];

  const [rows] = await pool.query<any[]>(query, params);
  return rows.length > 0;
}

/**
 * Records a slug change in slug_history table for 301 redirects
 */
export async function recordSlugHistory(
  entity: 'project' | 'paper',
  entityId: number,
  oldSlug: string
): Promise<void> {
  if (!oldSlug || !oldSlug.trim()) return;

  await pool.query(
    'INSERT INTO slug_history (entity, entity_id, slug) VALUES (?, ?, ?)',
    [entity, entityId, oldSlug.trim()]
  );
}

/**
 * Lookup whether an old slug maps to a current entity's new slug
 */
export async function findCurrentSlug(
  entity: 'project' | 'paper',
  oldSlug: string
): Promise<string | null> {
  const [historyRows] = await pool.query<any[]>(
    'SELECT entity_id FROM slug_history WHERE entity = ? AND slug = ? ORDER BY created_at DESC LIMIT 1',
    [entity, oldSlug]
  );

  if (historyRows.length === 0) return null;

  const entityId = historyRows[0].entity_id;
  const table = entity === 'project' ? 'projects' : 'papers';
  const [currentRows] = await pool.query<any[]>(
    `SELECT slug FROM ${table} WHERE id = ? LIMIT 1`,
    [entityId]
  );

  if (currentRows.length === 0) return null;
  return currentRows[0].slug;
}
