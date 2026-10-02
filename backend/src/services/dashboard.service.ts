// backend/src/services/dashboard.service.ts — Real Database Analytics
import { pool } from '../db/pool';

export interface DashboardStats {
  projects: {
    total: number;
    published: number;
    draft: number;
  };
  papers_count: number;
  categories_count: number;
  media: {
    total_files: number;
    total_bytes: number;
  };
  projects_by_category: {
    category_id: number;
    name: string;
    slug: string;
    count: number;
    percentage: number;
  }[];
  recently_updated: {
    id: number;
    title: string;
    slug: string;
    type: 'project' | 'paper';
    status: 'draft' | 'published';
    updated_at: string;
  }[];
  needs_attention: {
    id: number;
    title: string;
    slug: string;
    issue: string;
    type: 'project' | 'paper';
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // 1. Projects counts
  const [projCounts] = await pool.query<any[]>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
    FROM projects
  `);
  const totalProjects = Number(projCounts[0]?.total || 0);
  const publishedProjects = Number(projCounts[0]?.published || 0);
  const draftProjects = Number(projCounts[0]?.draft || 0);

  // 2. Papers count
  const [papCounts] = await pool.query<any[]>('SELECT COUNT(*) as total FROM papers');
  const papersCount = Number(papCounts[0]?.total || 0);

  // 3. Categories count
  const [catCounts] = await pool.query<any[]>('SELECT COUNT(*) as total FROM categories');
  const categoriesCount = Number(catCounts[0]?.total || 0);

  // 4. Media count and bytes
  const [mediaCounts] = await pool.query<any[]>(`
    SELECT COUNT(*) as total_files, COALESCE(SUM(size_bytes), 0) as total_bytes FROM media
  `);
  const totalMediaFiles = Number(mediaCounts[0]?.total_files || 0);
  const totalMediaBytes = Number(mediaCounts[0]?.total_bytes || 0);

  // 5. Projects by category
  const [catBreakdown] = await pool.query<any[]>(`
    SELECT c.id as category_id, c.name, c.slug, COUNT(p.id) as count
    FROM categories c
    LEFT JOIN projects p ON p.category_id = c.id
    WHERE c.content_type = 'project'
    GROUP BY c.id, c.name, c.slug
    ORDER BY count DESC
  `);
  const projectsByCategory = catBreakdown.map((r: any) => ({
    category_id: r.category_id,
    name: r.name,
    slug: r.slug,
    count: Number(r.count),
    percentage: totalProjects > 0 ? Math.round((Number(r.count) / totalProjects) * 100) : 0
  }));

  // 6. Recently updated
  const [recentProjects] = await pool.query<any[]>(`
    SELECT id, title, slug, 'project' as type, status, updated_at
    FROM projects
    ORDER BY updated_at DESC LIMIT 6
  `);

  // 7. Needs attention items
  const [attentionProjects] = await pool.query<any[]>(`
    SELECT id, title, slug, 'project' as type,
      CASE
        WHEN status = 'draft' THEN 'Draft status (unpublished)'
        WHEN primary_media_id IS NULL THEN 'Missing primary media'
        WHEN summary IS NULL OR summary = '' THEN 'Missing project summary'
        ELSE 'Review required'
      END as issue
    FROM projects
    WHERE status = 'draft' OR primary_media_id IS NULL OR summary IS NULL OR summary = ''
    LIMIT 6
  `);

  return {
    projects: {
      total: totalProjects,
      published: publishedProjects,
      draft: draftProjects
    },
    papers_count: papersCount,
    categories_count: categoriesCount,
    media: {
      total_files: totalMediaFiles,
      total_bytes: totalMediaBytes
    },
    projects_by_category: projectsByCategory,
    recently_updated: recentProjects.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      type: r.type,
      status: r.status,
      updated_at: r.updated_at
    })),
    needs_attention: attentionProjects.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      issue: r.issue,
      type: r.type
    }))
  };
}
