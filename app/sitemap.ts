// app/sitemap.ts — Dynamic Sitemap from MySQL database
import { MetadataRoute } from 'next';
import { listProjects } from '@/backend/src/services/projects.service';
import { pool } from '@/backend/src/db/pool';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || 'https://dominion.design';

  let projectUrls: MetadataRoute.Sitemap = [];
  let paperUrls: MetadataRoute.Sitemap = [];

  try {
    const projects = await listProjects({ status: 'published' });
    projectUrls = projects.map((p) => ({
      url: `${baseUrl}/work/${p.slug}`,
      lastModified: new Date(p.updated_at || p.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    }));

    const [paperRows] = await pool.query<any[]>(
      "SELECT slug, updated_at, created_at FROM papers WHERE status = 'published'"
    );
    paperUrls = paperRows.map((pap) => ({
      url: `${baseUrl}/papers/${pap.slug}`,
      lastModified: new Date(pap.updated_at || pap.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    }));
  } catch (err) {
    console.warn('[SITEMAP] Failed to fetch live items from DB, fallback to root:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0
    },
    ...projectUrls,
    ...paperUrls
  ];
}
