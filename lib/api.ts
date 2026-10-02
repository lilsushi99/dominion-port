// lib/api.ts — Data Fetcher with direct database access on server and API client fallback
import { getPublicProfile } from '@/backend/src/services/cms.service';
import { listCategories } from '@/backend/src/services/categories.service';
import { listProjects, getProjectBySlug as getProjectBySlugService } from '@/backend/src/services/projects.service';
import { findCurrentSlug } from '@/backend/src/services/slug.service';
import { pool } from '@/backend/src/db/pool';

export interface SiteProfile {
  name: string;
  intro_html: string;
  sign_off: string;
  list_heading: string;
  contact_links: Array<{ id: number; label: string; url: string; sort_order: number }>;
  footer: {
    year: number;
    copyright_text: string;
    designed_by_text: string;
    designer_name: string;
    designer_url: string;
  };
}

export async function getProfile(): Promise<SiteProfile> {
  try {
    const data = await getPublicProfile();
    return {
      name: 'dominion',
      intro_html: data.home_content.body_html,
      sign_off: data.home_content.sign_off,
      list_heading: data.site_settings.projects_heading,
      contact_links: data.cta_links,
      footer: data.footer
    };
  } catch (err) {
    console.warn('[API] getProfile DB query error, using defaults:', err);
    return {
      name: 'dominion',
      intro_html: '<p>hey, i\'m dominion. i design and build web software, design systems, and data tools.</p>',
      sign_off: 'love,\ndominion',
      list_heading: "p.s. things i've made and written…",
      contact_links: [
        { id: 1, label: 'email me', url: 'mailto:dominion@example.com', sort_order: 1 },
        { id: 2, label: 'text me on linkedin', url: 'https://linkedin.com/in/dominion', sort_order: 2 },
        { id: 3, label: 'whatsapp me', url: 'https://wa.me/1234567890', sort_order: 3 },
        { id: 4, label: 'find me on x', url: 'https://x.com/dominion', sort_order: 4 }
      ],
      footer: {
        year: 2026,
        copyright_text: '',
        designed_by_text: 'Designed by',
        designer_name: 'Castiel',
        designer_url: 'https://dflamez.com.ng'
      }
    };
  }
}

export async function getCategories(): Promise<Array<{ id: number; slug: string; name: string; sort_order: number; content_type: string }>> {
  try {
    const cats = await listCategories({ includeInactive: false });
    return cats.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      sort_order: c.sort_order,
      content_type: c.content_type
    }));
  } catch (err) {
    console.warn('[API] getCategories DB error:', err);
    return [];
  }
}

export async function getItems(categorySlug?: string): Promise<any[]> {
  try {
    const projects = await listProjects({
      categorySlug: categorySlug === 'papers' ? undefined : categorySlug,
      status: 'published'
    });

    const projectItems = projects.map(p => {
      // For preview in list row, prefer poster_media, or primary_media if it is an image
      let previewImage = p.poster_media;
      if (!previewImage && p.primary_media && p.primary_media.kind === 'image') {
        previewImage = p.primary_media;
      }

      let previewPath: string | null = null;
      if (previewImage) {
        previewPath = previewImage.public_url.startsWith('http') || previewImage.public_url.startsWith('/')
          ? previewImage.public_url
          : `/${previewImage.public_url}`;
      } else if (p.poster_media_id) {
        previewPath = `/media/sample-poster.svg`;
      }

      return {
        id: p.id,
        slug: p.slug,
        year: p.pub_year,
        title: p.title,
        summary: p.summary,
        type: 'project' as const,
        category_slug: p.category_slug || 'web-development',
        href: `/work/${p.slug}`,
        is_external: false,
        live_url: p.project_url,
        preview: previewPath
          ? {
              path: previewPath,
              alt: previewImage?.alt || p.title,
              width: previewImage?.width || 120,
              height: previewImage?.height || 80
            }
          : null
      };
    });

    // If papers category requested or all items
    if (!categorySlug || categorySlug === 'papers') {
      const [paperRows] = await pool.query<any[]>(
        `SELECT pap.*, c.slug as category_slug,
                m.relative_path as cover_path, m.alt as cover_alt, m.width as cover_width, m.height as cover_height
         FROM papers pap
         INNER JOIN categories c ON pap.category_id = c.id
         LEFT JOIN media m ON pap.cover_media_id = m.id
         WHERE pap.status = 'published'
         ORDER BY pap.pub_year DESC, pap.created_at DESC`
      );

      const paperItems = paperRows.map(pap => ({
        id: pap.id,
        slug: pap.slug,
        year: pap.pub_year,
        title: pap.title,
        summary: pap.summary || '',
        type: 'article' as const,
        category_slug: 'papers',
        href: `/papers/${pap.slug}`,
        is_external: false,
        preview: pap.cover_path
          ? {
              path: pap.cover_path.startsWith('http') ? pap.cover_path : `/media/${pap.cover_path.replace(/^\/+/, '')}`,
              alt: pap.cover_alt || pap.title,
              width: pap.cover_width,
              height: pap.cover_height
            }
          : null
      }));

      if (categorySlug === 'papers') {
        return paperItems;
      }

      return [...projectItems, ...paperItems];
    }

    return projectItems;
  } catch (err) {
    console.warn('[API] getItems DB query error:', err);
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<any | null> {
  try {
    const result = await getProjectBySlugService(slug);
    if (result.redirectSlug) {
      return { redirect: true, redirectSlug: result.redirectSlug };
    }
    return result.project || null;
  } catch (err) {
    console.warn('[API] getProjectBySlug DB query error:', err);
    return null;
  }
}

export async function getArticleBySlug(slug: string): Promise<any | null> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM papers WHERE slug = ? AND status = \'published\' LIMIT 1',
      [slug]
    );

    if (!rows || rows.length === 0) {
      const redirectSlug = await findCurrentSlug('paper', slug);
      if (redirectSlug && redirectSlug !== slug) {
        return { redirect: true, redirectSlug };
      }
      return null;
    }
    const r = rows[0];

    // Format blocks or HTML for ArticleBody component
    const content = typeof r.content_json === 'string' ? JSON.parse(r.content_json) : r.content_json;

    return {
      id: r.id,
      slug: r.slug,
      year: r.pub_year,
      published_at: r.published_at ? new Date(r.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : String(r.pub_year),
      title: r.title,
      summary: r.summary || '',
      content_html: r.content_html,
      blocks: content?.content || []
    };
  } catch (err) {
    console.warn('[API] getArticleBySlug DB query error:', err);
    return null;
  }
}
