// lib/api.ts — Data Fetcher with direct database access on server and API client fallback
import { getPublicProfile } from '@/backend/src/services/cms.service';
import { listCategories } from '@/backend/src/services/categories.service';
import { listProjects, getProjectBySlug as getProjectBySlugService } from '@/backend/src/services/projects.service';
import { listPapers, getPaperBySlug as getPaperBySlugService } from '@/backend/src/services/papers.service';
import { findCurrentSlug } from '@/backend/src/services/slug.service';
import { pool } from '@/backend/src/db/pool';
import { Category, ListItem } from '@/lib/types';
import { getSafeMediaUrl } from '@/lib/media-url';

export interface SiteProfile {
  name: string;
  intro_html: string;
  sign_off: string;
  list_heading: string;
  profile_images: Array<{
    id: number;
    media_id: number;
    sort_order: number;
    url: string;
    alt?: string | null;
    width?: number | null;
    height?: number | null;
  }>;
  contact_links: Array<{
    id: number;
    label: string;
    url: string;
    sort_order: number;
    presentation_mode?: 'text' | 'icon';
    platform?: string | null;
  }>;
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
      profile_images: data.profile_images || [],
      contact_links: data.cta_links,
      footer: data.footer
    };
  } catch (err) {
    console.warn('[API] getProfile DB query error, using defaults:', err);
    return {
      name: 'dominion',
      intro_html: '<p>hey, i\'m dominion. i design and build web software, design systems, and data tools.</p>',
      sign_off: '',
      list_heading: "p.s. things i've made and written…",
      profile_images: [],
      contact_links: [
        { id: 1, label: 'email me', url: 'mailto:dominion@example.com', sort_order: 1, presentation_mode: 'text' },
        { id: 2, label: 'text me on linkedin', url: 'https://linkedin.com/in/dominion', sort_order: 2, presentation_mode: 'text' },
        { id: 3, label: 'whatsapp me', url: 'https://wa.me/1234567890', sort_order: 3, presentation_mode: 'text' },
        { id: 4, label: 'find me on x', url: 'https://x.com/dominion', sort_order: 4, presentation_mode: 'text' }
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

/**
 * Returns top-level Work category tabs (Project categories + Papers).
 * Paper subcategories are excluded from top-level filter tabs (Phase 4).
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const projectCats = await listCategories({ contentType: 'project', includeInactive: false });
    const formatted: Category[] = projectCats.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      sort_order: c.sort_order,
      content_type: 'project',
      is_active: c.is_active
    }));

    // Append Papers tab as a top-level work filter
    formatted.push({
      id: 999999,
      slug: 'papers',
      name: 'papers',
      sort_order: 9999,
      content_type: 'paper',
      is_active: true
    });

    return formatted;
  } catch (err) {
    console.warn('[API] getCategories DB error:', err);
    return [
      { id: 1, slug: 'web-development', name: 'web development', sort_order: 1, content_type: 'project' },
      { id: 2, slug: 'product-design', name: 'product design', sort_order: 2, content_type: 'project' },
      { id: 3, slug: 'dashboards', name: 'dashboards', sort_order: 3, content_type: 'project' },
      { id: 999999, slug: 'papers', name: 'papers', sort_order: 4, content_type: 'paper' }
    ];
  }
}

/**
 * Returns Paper subcategories with item counts for Level 1 Papers browsing (Phase 5).
 */
export async function getPaperCategories(): Promise<Category[]> {
  return [];
}

/**
 * Returns published projects and papers for homepage list.
 */
export async function getItems(categorySlug?: string): Promise<ListItem[]> {
  try {
    const normalizedCategory = (!categorySlug || categorySlug === 'all') ? undefined : categorySlug;

    const projects = await listProjects({
      categorySlug: normalizedCategory && normalizedCategory !== 'papers' ? normalizedCategory : undefined,
      status: 'published',
      includeDrafts: false
    });

    const projectItems: ListItem[] = projects.map((p) => {
      let previewImage = p.poster_media;
      if (!previewImage && p.primary_media && p.primary_media.kind === 'image') {
        previewImage = p.primary_media;
      }

      let previewPath: string | null = null;
      if (previewImage) {
        previewPath = getSafeMediaUrl(previewImage.public_url || previewImage.relative_path);
      } else if (p.primary_media_id && p.primary_media) {
        previewPath = getSafeMediaUrl(p.primary_media.public_url || p.primary_media.relative_path);
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
    if (!normalizedCategory || normalizedCategory === 'papers') {
      const papers = await listPapers({
        status: 'published',
        includeDrafts: false
      });

      const paperItems: ListItem[] = papers.map((pap) => {
        const coverRaw = pap.cover_media?.public_url || pap.cover_media?.relative_path;
        const coverUrl = getSafeMediaUrl(coverRaw);

        return {
          id: pap.id,
          slug: pap.slug,
          year: pap.pub_year,
          title: pap.title,
          summary: pap.summary || '',
          type: 'article' as const,
          category_slug: 'papers',
          href: `/papers/${pap.slug}`,
          is_external: false,
          preview: coverUrl
            ? {
                path: coverUrl,
                alt: pap.cover_media?.alt || pap.title,
                width: pap.cover_media?.width || 120,
                height: pap.cover_media?.height || 80
              }
            : null
        };
      });

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

/**
 * Returns all published papers with category metadata.
 */
export async function getAllPapers(categorySlug?: string): Promise<any[]> {
  try {
    const papers = await listPapers({
      categorySlug: categorySlug || undefined,
      status: 'published',
      includeDrafts: false
    });
    return papers;
  } catch (err) {
    console.warn('[API] getAllPapers error:', err);
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
    const paper = await getPaperBySlugService(slug);
    if (!paper || paper.status !== 'published') {
      const redirectSlug = await findCurrentSlug('paper', slug);
      if (redirectSlug && redirectSlug !== slug) {
        return { redirect: true, redirectSlug };
      }
      return null;
    }

    return {
      id: paper.id,
      slug: paper.slug,
      year: paper.pub_year,
      published_at: paper.published_at
        ? new Date(paper.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : String(paper.pub_year),
      title: paper.title,
      summary: paper.summary || '',
      category_name: 'papers',
      cover_media: paper.cover_media || null,
      content_html: paper.content_html,
      blocks: paper.content_json?.content || []
    };
  } catch (err) {
    console.warn('[API] getArticleBySlug DB query error:', err);
    return null;
  }
}
