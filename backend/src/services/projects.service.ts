// backend/src/services/projects.service.ts — Projects & Gallery Service
import { pool } from '../db/pool';
import { formatMediaRecord, MediaRecord } from './media.service';

export interface GalleryItem {
  id?: number;
  media_id: number;
  caption: string | null;
  sort_order: number;
  media?: MediaRecord;
}

export interface ProjectRecord {
  id: number;
  slug: string;
  title: string;
  pub_year: number;
  pub_month: number | null;
  pub_day: number | null;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  primary_media_id: number | null;
  poster_media_id: number | null;
  project_url: string | null;
  link_label: string | null;
  summary: string;
  paragraph_1: string;
  paragraph_2: string;
  paragraph_3: string;
  status: 'draft' | 'published';
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  primary_media?: MediaRecord | null;
  poster_media?: MediaRecord | null;
  gallery?: GalleryItem[];
}

export interface CreateProjectInput {
  slug: string;
  title: string;
  pub_year: number;
  pub_month?: number | null;
  pub_day?: number | null;
  category_id: number;
  primary_media_id?: number | null;
  poster_media_id?: number | null;
  project_url?: string | null;
  link_label?: string | null;
  summary: string;
  paragraph_1: string;
  paragraph_2: string;
  paragraph_3: string;
  status?: 'draft' | 'published';
  sort_order?: number;
  gallery?: { media_id: number; caption?: string | null; sort_order?: number }[];
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

/**
 * Lists projects with filtering.
 */
export async function listProjects(options?: {
  categorySlug?: string;
  status?: 'draft' | 'published';
  includeDrafts?: boolean;
}): Promise<ProjectRecord[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.categorySlug && options.categorySlug !== 'all') {
    conditions.push('c.slug = ?');
    params.push(options.categorySlug);
  }

  if (options?.status) {
    conditions.push('p.status = ?');
    params.push(options.status);
  } else if (!options?.includeDrafts) {
    conditions.push("p.status = 'published'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT p.*,
           c.name as category_name, c.slug as category_slug,
           pm.kind as pm_kind, pm.original_name as pm_orig_name, pm.stored_name as pm_stored_name,
           pm.relative_path as pm_rel_path, pm.mime as pm_mime, pm.size_bytes as pm_size_bytes,
           pm.width as pm_width, pm.height as pm_height, pm.duration_s as pm_duration_s, pm.alt as pm_alt,
           pm.created_at as pm_created_at,
           post.kind as post_kind, post.original_name as post_orig_name, post.stored_name as post_stored_name,
           post.relative_path as post_rel_path, post.mime as post_mime, post.size_bytes as post_size_bytes,
           post.width as post_width, post.height as post_height, post.duration_s as post_duration_s, post.alt as post_alt,
           post.created_at as post_created_at
    FROM projects p
    INNER JOIN categories c ON p.category_id = c.id
    LEFT JOIN media pm ON p.primary_media_id = pm.id
    LEFT JOIN media post ON p.poster_media_id = post.id
    ${whereClause}
    ORDER BY p.sort_order ASC, p.pub_year DESC, p.created_at DESC
  `;

  const [rows] = await pool.query<any[]>(query, params);

  return rows.map((r: any) => {
    const primary_media = r.primary_media_id
      ? formatMediaRecord({
          id: r.primary_media_id,
          kind: r.pm_kind,
          original_name: r.pm_orig_name,
          stored_name: r.pm_stored_name,
          relative_path: r.pm_rel_path,
          mime: r.pm_mime,
          size_bytes: r.pm_size_bytes,
          width: r.pm_width,
          height: r.pm_height,
          duration_s: r.pm_duration_s,
          alt: r.pm_alt,
          created_at: r.pm_created_at
        })
      : null;

    const poster_media = r.poster_media_id
      ? formatMediaRecord({
          id: r.poster_media_id,
          kind: r.post_kind,
          original_name: r.post_orig_name,
          stored_name: r.post_stored_name,
          relative_path: r.post_rel_path,
          mime: r.post_mime,
          size_bytes: r.post_size_bytes,
          width: r.post_width,
          height: r.post_height,
          duration_s: r.post_duration_s,
          alt: r.post_alt,
          created_at: r.post_created_at
        })
      : null;

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      pub_year: Number(r.pub_year),
      pub_month: r.pub_month ? Number(r.pub_month) : null,
      pub_day: r.pub_day ? Number(r.pub_day) : null,
      category_id: r.category_id,
      category_name: r.category_name,
      category_slug: r.category_slug,
      primary_media_id: r.primary_media_id,
      poster_media_id: r.poster_media_id,
      project_url: r.project_url,
      link_label: r.link_label,
      summary: r.summary,
      paragraph_1: r.paragraph_1,
      paragraph_2: r.paragraph_2,
      paragraph_3: r.paragraph_3,
      status: r.status,
      sort_order: r.sort_order,
      published_at: r.published_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      primary_media,
      poster_media
    };
  });
}

/**
 * Fetches full gallery items for a project.
 */
export async function getProjectGallery(projectId: number): Promise<GalleryItem[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT pg.id, pg.project_id, pg.media_id, pg.caption, pg.sort_order,
            m.kind, m.original_name, m.stored_name, m.relative_path, m.mime,
            m.size_bytes, m.width, m.height, m.duration_s, m.alt, m.created_at as media_created_at
     FROM project_gallery pg
     INNER JOIN media m ON pg.media_id = m.id
     WHERE pg.project_id = ?
     ORDER BY pg.sort_order ASC, pg.id ASC`,
    [projectId]
  );

  return rows.map((r: any) => ({
    id: r.id,
    media_id: r.media_id,
    caption: r.caption,
    sort_order: r.sort_order,
    media: formatMediaRecord({
      id: r.media_id,
      kind: r.kind,
      original_name: r.original_name,
      stored_name: r.stored_name,
      relative_path: r.relative_path,
      mime: r.mime,
      size_bytes: r.size_bytes,
      width: r.width,
      height: r.height,
      duration_s: r.duration_s,
      alt: r.alt,
      created_at: r.media_created_at
    })
  }));
}

/**
 * Gets a project by ID with its gallery.
 */
export async function getProjectById(id: number): Promise<ProjectRecord | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM projects p
     INNER JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );

  if (!rows || rows.length === 0) return null;
  const r = rows[0];

  const gallery = await getProjectGallery(r.id);
  const primary_media = r.primary_media_id ? await getMediaByIdHelper(r.primary_media_id) : null;
  const poster_media = r.poster_media_id ? await getMediaByIdHelper(r.poster_media_id) : null;

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    pub_year: Number(r.pub_year),
    pub_month: r.pub_month ? Number(r.pub_month) : null,
    pub_day: r.pub_day ? Number(r.pub_day) : null,
    category_id: r.category_id,
    category_name: r.category_name,
    category_slug: r.category_slug,
    primary_media_id: r.primary_media_id,
    poster_media_id: r.poster_media_id,
    project_url: r.project_url,
    link_label: r.link_label,
    summary: r.summary,
    paragraph_1: r.paragraph_1,
    paragraph_2: r.paragraph_2,
    paragraph_3: r.paragraph_3,
    status: r.status,
    sort_order: r.sort_order,
    published_at: r.published_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    primary_media,
    poster_media,
    gallery
  };
}

/**
 * Gets a project by Slug, checking slug_history if necessary for 301 redirects.
 */
export async function getProjectBySlug(slug: string): Promise<{
  project?: ProjectRecord;
  redirectSlug?: string;
}> {
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Check direct match
  const [rows] = await pool.query<any[]>(
    'SELECT id FROM projects WHERE slug = ? LIMIT 1',
    [cleanSlug]
  );

  if (rows && rows.length > 0) {
    const project = await getProjectById(rows[0].id);
    if (project) return { project };
  }

  // 2. Check slug_history
  const [historyRows] = await pool.query<any[]>(
    "SELECT entity_id FROM slug_history WHERE entity = 'project' AND slug = ? ORDER BY created_at DESC LIMIT 1",
    [cleanSlug]
  );

  if (historyRows && historyRows.length > 0) {
    const currentProject = await getProjectById(historyRows[0].entity_id);
    if (currentProject) {
      return { redirectSlug: currentProject.slug };
    }
  }

  return {};
}

/**
 * Creates a project.
 */
export async function createProject(input: CreateProjectInput): Promise<ProjectRecord> {
  const cleanSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
  const status = input.status || 'draft';

  // Validation
  if (!input.title?.trim()) throw new Error('Project title is required.');
  if (!input.pub_year) throw new Error('Publication year is required.');
  if (!input.category_id) throw new Error('Category is required.');
  if (!input.summary?.trim()) throw new Error('Project summary is required.');

  if (status === 'published') {
    if (!input.paragraph_1?.trim() || !input.paragraph_2?.trim() || !input.paragraph_3?.trim()) {
      throw new Error('All three justified description paragraphs are required to publish a project.');
    }
  }

  let order = input.sort_order;
  if (order === undefined) {
    const [maxRows] = await pool.query<any[]>('SELECT MAX(sort_order) as max_order FROM projects');
    order = (maxRows[0]?.max_order || 0) + 1;
  }

  const publishedAt = status === 'published' ? new Date() : null;

  const [result] = await pool.query<any>(
    `INSERT INTO projects (
      slug, title, pub_year, pub_month, pub_day, category_id,
      primary_media_id, poster_media_id, project_url, link_label, summary,
      paragraph_1, paragraph_2, paragraph_3, status, sort_order, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cleanSlug,
      input.title.trim(),
      input.pub_year,
      input.pub_month || null,
      input.pub_day || null,
      input.category_id,
      input.primary_media_id || null,
      input.poster_media_id || null,
      input.project_url?.trim() || null,
      input.link_label?.trim() || null,
      input.summary.trim(),
      input.paragraph_1?.trim() || '',
      input.paragraph_2?.trim() || '',
      input.paragraph_3?.trim() || '',
      status,
      order,
      publishedAt
    ]
  );

  const projectId = result.insertId;

  // Insert gallery items
  if (input.gallery && input.gallery.length > 0) {
    for (let i = 0; i < input.gallery.length; i++) {
      const g = input.gallery[i];
      await pool.query(
        'INSERT INTO project_gallery (project_id, media_id, caption, sort_order) VALUES (?, ?, ?, ?)',
        [projectId, g.media_id, g.caption?.trim() || null, g.sort_order ?? i + 1]
      );
    }
  }

  const created = await getProjectById(projectId);
  if (!created) throw new Error('Failed to load newly created project.');
  return created;
}

/**
 * Updates an existing project.
 */
export async function updateProject(id: number, input: UpdateProjectInput): Promise<ProjectRecord | null> {
  const existing = await getProjectById(id);
  if (!existing) return null;

  const cleanSlug = input.slug
    ? input.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-')
    : existing.slug;

  // If slug changed, record old slug in slug_history
  if (cleanSlug !== existing.slug) {
    await pool.query(
      "INSERT INTO slug_history (entity, entity_id, slug) VALUES ('project', ?, ?)",
      [id, existing.slug]
    );
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const pubYear = input.pub_year !== undefined ? input.pub_year : existing.pub_year;
  const pubMonth = input.pub_month !== undefined ? input.pub_month : existing.pub_month;
  const pubDay = input.pub_day !== undefined ? input.pub_day : existing.pub_day;
  const categoryId = input.category_id !== undefined ? input.category_id : existing.category_id;
  const primaryMediaId = input.primary_media_id !== undefined ? input.primary_media_id : existing.primary_media_id;
  const posterMediaId = input.poster_media_id !== undefined ? input.poster_media_id : existing.poster_media_id;
  const projectUrl = input.project_url !== undefined ? (input.project_url?.trim() || null) : existing.project_url;
  const linkLabel = input.link_label !== undefined ? (input.link_label?.trim() || null) : existing.link_label;
  const summary = input.summary !== undefined ? input.summary.trim() : existing.summary;
  const p1 = input.paragraph_1 !== undefined ? input.paragraph_1.trim() : existing.paragraph_1;
  const p2 = input.paragraph_2 !== undefined ? input.paragraph_2.trim() : existing.paragraph_2;
  const p3 = input.paragraph_3 !== undefined ? input.paragraph_3.trim() : existing.paragraph_3;
  const status = input.status !== undefined ? input.status : existing.status;
  const sortOrder = input.sort_order !== undefined ? input.sort_order : existing.sort_order;

  if (status === 'published') {
    if (!p1 || !p2 || !p3) {
      throw new Error('All three description paragraphs are required to publish a project.');
    }
  }

  const publishedAt =
    status === 'published' && !existing.published_at
      ? new Date()
      : existing.published_at;

  await pool.query(
    `UPDATE projects SET
      slug = ?, title = ?, pub_year = ?, pub_month = ?, pub_day = ?, category_id = ?,
      primary_media_id = ?, poster_media_id = ?, project_url = ?, link_label = ?, summary = ?,
      paragraph_1 = ?, paragraph_2 = ?, paragraph_3 = ?, status = ?, sort_order = ?, published_at = ?
     WHERE id = ?`,
    [
      cleanSlug,
      title,
      pubYear,
      pubMonth,
      pubDay,
      categoryId,
      primaryMediaId,
      posterMediaId,
      projectUrl,
      linkLabel,
      summary,
      p1,
      p2,
      p3,
      status,
      sortOrder,
      publishedAt,
      id
    ]
  );

  // Sync gallery if provided
  if (input.gallery !== undefined) {
    await pool.query('DELETE FROM project_gallery WHERE project_id = ?', [id]);
    for (let i = 0; i < input.gallery.length; i++) {
      const g = input.gallery[i];
      await pool.query(
        'INSERT INTO project_gallery (project_id, media_id, caption, sort_order) VALUES (?, ?, ?, ?)',
        [id, g.media_id, g.caption?.trim() || null, g.sort_order ?? i + 1]
      );
    }
  }

  return getProjectById(id);
}

/**
 * Deletes a project.
 */
export async function deleteProject(id: number): Promise<boolean> {
  const [result] = await pool.query<any>('DELETE FROM projects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Updates status (publish / unpublish toggle).
 */
export async function updateProjectStatus(id: number, status: 'draft' | 'published'): Promise<ProjectRecord | null> {
  return updateProject(id, { status });
}

/**
 * Reorders projects.
 */
export async function reorderProjects(orderedIds: number[]): Promise<ProjectRecord[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await pool.query('UPDATE projects SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
  }
  return listProjects({ includeDrafts: true });
}

async function getMediaByIdHelper(id: number): Promise<MediaRecord | null> {
  const [rows] = await pool.query<any[]>('SELECT * FROM media WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return formatMediaRecord(rows[0]);
}
