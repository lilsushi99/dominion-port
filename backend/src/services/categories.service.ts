// backend/src/services/categories.service.ts — Category Management Service
import { pool } from '../db/pool';

export interface Category {
  id: number;
  slug: string;
  name: string;
  content_type: 'project' | 'paper';
  sort_order: number;
  is_active: boolean;
  item_count?: number;
}

/**
 * Lists categories with optional content_type and active filters.
 */
export async function listCategories(options?: {
  contentType?: 'project' | 'paper';
  includeInactive?: boolean;
}): Promise<Category[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.contentType) {
    conditions.push('c.content_type = ?');
    params.push(options.contentType);
  }

  if (!options?.includeInactive) {
    conditions.push('c.is_active = 1');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<any[]>(
    `SELECT c.*,
       CASE 
         WHEN c.content_type = 'project' THEN (SELECT COUNT(*) FROM projects p WHERE p.category_id = c.id)
         ELSE (SELECT COUNT(*) FROM papers pap WHERE pap.category_id = c.id)
       END as item_count
     FROM categories c
     ${whereClause}
     ORDER BY c.sort_order ASC, c.id ASC`,
    params
  );

  return rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    content_type: r.content_type,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active),
    item_count: Number(r.item_count || 0)
  }));
}

/**
 * Gets a category by ID.
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  const [rows] = await pool.query<any[]>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    content_type: r.content_type,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active)
  };
}

/**
 * Gets a category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const [rows] = await pool.query<any[]>('SELECT * FROM categories WHERE slug = ? LIMIT 1', [slug]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    content_type: r.content_type,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active)
  };
}

/**
 * Creates a new category.
 */
export async function createCategory(
  slug: string,
  name: string,
  contentType: 'project' | 'paper' = 'project',
  sortOrder?: number,
  isActive = true
): Promise<Category> {
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
  
  let order = sortOrder;
  if (order === undefined) {
    const [maxRows] = await pool.query<any[]>('SELECT MAX(sort_order) as max_order FROM categories');
    order = (maxRows[0]?.max_order || 0) + 1;
  }

  const [result] = await pool.query<any>(
    'INSERT INTO categories (slug, name, content_type, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
    [cleanSlug, name.trim(), contentType, order, isActive ? 1 : 0]
  );

  const created = await getCategoryById(result.insertId);
  if (!created) throw new Error('Failed to retrieve newly created category.');
  return created;
}

/**
 * Updates an existing category.
 */
export async function updateCategory(
  id: number,
  slug: string,
  name: string,
  contentType: 'project' | 'paper',
  sortOrder: number,
  isActive: boolean
): Promise<Category | null> {
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');

  await pool.query(
    'UPDATE categories SET slug = ?, name = ?, content_type = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [cleanSlug, name.trim(), contentType, sortOrder, isActive ? 1 : 0, id]
  );

  return getCategoryById(id);
}

/**
 * Deletes a category safely. If items are assigned to it, deletion is blocked.
 */
export async function deleteCategorySafely(id: number): Promise<{ success: boolean; error?: string; itemCount?: number }> {
  // Check projects referencing category
  const [projCount] = await pool.query<any[]>('SELECT COUNT(*) as count FROM projects WHERE category_id = ?', [id]);
  const projectsCount = projCount[0]?.count || 0;

  // Check papers referencing category
  const [papCount] = await pool.query<any[]>('SELECT COUNT(*) as count FROM papers WHERE category_id = ?', [id]);
  const papersCount = papCount[0]?.count || 0;

  const totalAssigned = projectsCount + papersCount;
  if (totalAssigned > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${totalAssigned} items (${projectsCount} projects, ${papersCount} papers) are assigned to it. Reassign or delete them first.`,
      itemCount: totalAssigned
    };
  }

  const [result] = await pool.query<any>('DELETE FROM categories WHERE id = ?', [id]);
  return { success: result.affectedRows > 0 };
}

/**
 * Reorders categories.
 */
export async function reorderCategories(orderedIds: number[]): Promise<Category[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await pool.query('UPDATE categories SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
  }
  return listCategories({ includeInactive: true });
}
