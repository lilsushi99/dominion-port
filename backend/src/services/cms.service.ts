// backend/src/services/cms.service.ts — CMS Data Service
import { pool } from '../db/pool';
import { buildPublicMediaUrl } from './media.service';

export type BackgroundMode = 'black' | 'off_black';

export interface SiteSettings {
  id: number;
  projects_heading: string;
  background_mode: BackgroundMode;
  updated_at: string;
}

export interface HomeContent {
  id: number;
  body_json: any;
  body_html: string;
  sign_off: string;
  updated_at: string;
}

export interface CtaLink {
  id: number;
  label: string;
  url: string;
  presentation_mode?: 'text' | 'icon';
  platform?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface FooterSettings {
  id: number;
  year_mode: 'auto' | 'fixed';
  fixed_year: number | null;
  copyright_text: string;
  designed_by_text: string;
  designer_name: string;
  designer_url: string;
  updated_at: string;
  current_display_year?: number;
}

export interface ProfileImageItem {
  id: number;
  media_id: number;
  sort_order: number;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface PublicProfilePayload {
  site_settings: {
    projects_heading: string;
    background_mode: BackgroundMode;
  };
  home_content: {
    body_html: string;
    sign_off: string;
  };
  profile_images: ProfileImageItem[];
  cta_links: CtaLink[];
  footer: {
    year: number;
    copyright_text: string;
    designed_by_text: string;
    designer_name: string;
    designer_url: string;
  };
}

/**
 * Gets site settings (projects heading).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const [rows] = await pool.query<any[]>('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
  if (!rows || rows.length === 0) {
    return {
      id: 1,
      projects_heading: "p.s. things i've made and written…",
      background_mode: 'off_black',
      updated_at: new Date().toISOString()
    };
  }
  return { ...rows[0], background_mode: rows[0].background_mode === 'black' ? 'black' : 'off_black' };
}

/**
 * Updates site settings.
 */
export async function updateSiteSettings(
  projects_heading: string,
  background_mode: BackgroundMode = 'off_black'
): Promise<SiteSettings> {
  const mode: BackgroundMode = background_mode === 'black' ? 'black' : 'off_black';
  await pool.query(
    'INSERT INTO site_settings (id, projects_heading, background_mode) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE projects_heading = VALUES(projects_heading), background_mode = VALUES(background_mode)',
    [projects_heading.trim(), mode]
  );
  return getSiteSettings();
}

/**
 * Gets home content (body prose and sign-off).
 */
export async function getHomeContent(): Promise<HomeContent> {
  const [rows] = await pool.query<any[]>('SELECT * FROM home_content WHERE id = 1 LIMIT 1');
  if (!rows || rows.length === 0) {
    return {
      id: 1,
      body_json: {},
      body_html: '',
      sign_off: '',
      updated_at: new Date().toISOString()
    };
  }
  const row = rows[0];
  return {
    id: row.id,
    body_json: typeof row.body_json === 'string' ? JSON.parse(row.body_json) : row.body_json,
    body_html: row.body_html,
    sign_off: row.sign_off || '',
    updated_at: row.updated_at
  };
}

/**
 * Updates home content.
 */
export async function updateHomeContent(
  body_json: any,
  body_html: string,
  sign_off?: string | null
): Promise<HomeContent> {
  const jsonString = typeof body_json === 'string' ? body_json : JSON.stringify(body_json);
  const cleanSignOff = (sign_off || '').trim();

  await pool.query(
    `INSERT INTO home_content (id, body_json, body_html, sign_off)
     VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       body_json = VALUES(body_json),
       body_html = VALUES(body_html),
       sign_off = VALUES(sign_off)`,
    [jsonString, body_html, cleanSignOff]
  );

  return getHomeContent();
}

/**
 * Lists CTA links.
 */
export async function listCtaLinks(includeInactive = false): Promise<CtaLink[]> {
  const query = includeInactive
    ? 'SELECT * FROM cta_links ORDER BY sort_order ASC, id ASC'
    : 'SELECT * FROM cta_links WHERE is_active = 1 ORDER BY sort_order ASC, id ASC';

  const [rows] = await pool.query<any[]>(query);
  return rows.map((r: any) => ({
    id: r.id,
    label: r.label,
    url: r.url,
    presentation_mode: r.presentation_mode || 'text',
    platform: r.platform || null,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active)
  }));
}

/**
 * Creates a CTA link.
 */
export async function createCtaLink(
  label: string,
  url: string,
  sort_order?: number,
  is_active = true,
  presentation_mode: 'text' | 'icon' = 'text',
  platform?: string | null
): Promise<CtaLink> {
  let order = sort_order;
  if (order === undefined) {
    const [maxRows] = await pool.query<any[]>('SELECT MAX(sort_order) as max_order FROM cta_links');
    order = (maxRows[0]?.max_order || 0) + 1;
  }

  const [result] = await pool.query<any>(
    'INSERT INTO cta_links (label, url, sort_order, is_active, presentation_mode, platform) VALUES (?, ?, ?, ?, ?, ?)',
    [label.trim(), url.trim(), order, is_active ? 1 : 0, presentation_mode, platform || null]
  );

  const [rows] = await pool.query<any[]>('SELECT * FROM cta_links WHERE id = ?', [result.insertId]);
  const r = rows[0];
  return {
    id: r.id,
    label: r.label,
    url: r.url,
    presentation_mode: r.presentation_mode || 'text',
    platform: r.platform || null,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active)
  };
}

/**
 * Updates a CTA link.
 */
export async function updateCtaLink(
  id: number,
  label: string,
  url: string,
  sort_order: number,
  is_active: boolean,
  presentation_mode: 'text' | 'icon' = 'text',
  platform?: string | null
): Promise<CtaLink | null> {
  await pool.query(
    'UPDATE cta_links SET label = ?, url = ?, sort_order = ?, is_active = ?, presentation_mode = ?, platform = ? WHERE id = ?',
    [label.trim(), url.trim(), sort_order, is_active ? 1 : 0, presentation_mode, platform || null, id]
  );

  const [rows] = await pool.query<any[]>('SELECT * FROM cta_links WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    label: r.label,
    url: r.url,
    presentation_mode: r.presentation_mode || 'text',
    platform: r.platform || null,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active)
  };
}

/**
 * Batch saves CTA links (reorder, active toggles, inline changes).
 */
export async function batchSaveCtaLinks(links: Array<Partial<CtaLink> & { id: number }>): Promise<CtaLink[]> {
  for (const link of links) {
    const updates: string[] = [];
    const params: any[] = [];

    if (link.label !== undefined) {
      updates.push('label = ?');
      params.push(link.label.trim());
    }
    if (link.url !== undefined) {
      updates.push('url = ?');
      params.push(link.url.trim());
    }
    if (link.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(link.sort_order);
    }
    if (link.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(link.is_active ? 1 : 0);
    }
    if (link.presentation_mode !== undefined) {
      updates.push('presentation_mode = ?');
      params.push(link.presentation_mode);
    }
    if (link.platform !== undefined) {
      updates.push('platform = ?');
      params.push(link.platform);
    }

    if (updates.length > 0) {
      params.push(link.id);
      await pool.query(`UPDATE cta_links SET ${updates.join(', ')} WHERE id = ?`, params);
    }
  }

  return listCtaLinks(true);
}

/**
 * Deletes a CTA link.
 */
export async function deleteCtaLink(id: number): Promise<boolean> {
  const [result] = await pool.query<any>('DELETE FROM cta_links WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Reorders CTA links.
 */
export async function reorderCtaLinks(orderedIds: number[]): Promise<CtaLink[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await pool.query('UPDATE cta_links SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
  }
  return listCtaLinks(true);
}

/**
 * Gets footer settings.
 */
export async function getFooterSettings(): Promise<FooterSettings> {
  const [rows] = await pool.query<any[]>('SELECT * FROM footer_settings WHERE id = 1 LIMIT 1');
  if (!rows || rows.length === 0) {
    return {
      id: 1,
      year_mode: 'fixed',
      fixed_year: 2026,
      copyright_text: '',
      designed_by_text: 'Designed by',
      designer_name: 'Castiel',
      designer_url: 'https://dflamez.com.ng',
      updated_at: new Date().toISOString(),
      current_display_year: 2026
    };
  }
  const r = rows[0];
  const currentYear = r.year_mode === 'fixed' && r.fixed_year ? r.fixed_year : new Date().getFullYear();
  return {
    id: r.id,
    year_mode: r.year_mode,
    fixed_year: r.fixed_year,
    copyright_text: r.copyright_text || '',
    designed_by_text: r.designed_by_text || 'Designed by',
    designer_name: r.designer_name || 'Castiel',
    designer_url: r.designer_url || 'https://dflamez.com.ng',
    updated_at: r.updated_at,
    current_display_year: currentYear
  };
}

/**
 * Updates footer settings.
 */
export async function updateFooterSettings(
  year_mode: 'auto' | 'fixed',
  fixed_year: number | null,
  copyright_text: string,
  designed_by_text: string,
  designer_name: string,
  designer_url: string
): Promise<FooterSettings> {
  await pool.query(
    `INSERT INTO footer_settings (id, year_mode, fixed_year, copyright_text, designed_by_text, designer_name, designer_url)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       year_mode = VALUES(year_mode),
       fixed_year = VALUES(fixed_year),
       copyright_text = VALUES(copyright_text),
       designed_by_text = VALUES(designed_by_text),
       designer_name = VALUES(designer_name),
       designer_url = VALUES(designer_url)`,
    [
      year_mode,
      year_mode === 'fixed' ? fixed_year || 2026 : null,
      copyright_text.trim(),
      designed_by_text.trim(),
      designer_name.trim(),
      designer_url.trim()
    ]
  );
  return getFooterSettings();
}

/**
 * Lists profile images in sorted order.
 */
export async function listProfileImages(): Promise<ProfileImageItem[]> {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT pi.id, pi.media_id, pi.sort_order,
              m.relative_path, m.alt, m.width, m.height
       FROM profile_images pi
       INNER JOIN media m ON pi.media_id = m.id
       ORDER BY pi.sort_order ASC, pi.id ASC`
    );

    return rows.map((r: any) => ({
      id: r.id,
      media_id: r.media_id,
      sort_order: r.sort_order,
      url: buildPublicMediaUrl(r.relative_path),
      alt: r.alt || 'Dominion',
      width: r.width || 128,
      height: r.height || 128
    }));
  } catch (err) {
    console.warn('[CMS] listProfileImages query failed:', err);
    return [];
  }
}

/**
 * Adds a profile image.
 */
export async function addProfileImage(mediaId: number): Promise<ProfileImageItem | null> {
  const [maxRows] = await pool.query<any[]>('SELECT MAX(sort_order) as max_order FROM profile_images');
  const nextOrder = (maxRows[0]?.max_order || 0) + 1;

  const [res] = await pool.query<any>(
    'INSERT INTO profile_images (media_id, sort_order) VALUES (?, ?)',
    [mediaId, nextOrder]
  );

  const images = await listProfileImages();
  return images.find((img) => img.id === res.insertId) || null;
}

/**
 * Removes a profile image.
 */
export async function deleteProfileImage(id: number): Promise<boolean> {
  const [res] = await pool.query<any>('DELETE FROM profile_images WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

/**
 * Reorders profile images.
 */
export async function reorderProfileImages(orderedIds: number[]): Promise<ProfileImageItem[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await pool.query('UPDATE profile_images SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
  }
  return listProfileImages();
}

/**
 * Returns full profile payload for public homepage.
 */
export async function getPublicProfile(): Promise<PublicProfilePayload> {
  const [siteSettings, homeContent, profileImages, ctaLinks, footerSettings] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    listProfileImages(),
    listCtaLinks(false),
    getFooterSettings()
  ]);

  return {
    site_settings: {
      projects_heading: siteSettings.projects_heading,
      background_mode: siteSettings.background_mode
    },
    home_content: {
      body_html: homeContent.body_html,
      sign_off: homeContent.sign_off
    },
    profile_images: profileImages,
    cta_links: ctaLinks,
    footer: {
      year: footerSettings.current_display_year || 2026,
      copyright_text: footerSettings.copyright_text,
      designed_by_text: footerSettings.designed_by_text,
      designer_name: footerSettings.designer_name,
      designer_url: footerSettings.designer_url
    }
  };
}
