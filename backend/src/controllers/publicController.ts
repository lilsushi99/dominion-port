import { Request, Response } from 'express';
import { pool } from '../db/pool';

export async function getProfile(req: Request, res: Response) {
  try {
    const [profileRows]: any = await pool.query('SELECT * FROM profile LIMIT 1');
    const [companies]: any = await pool.query('SELECT * FROM companies ORDER BY sort_order ASC');
    const [contacts]: any = await pool.query('SELECT * FROM contact_links ORDER BY sort_order ASC');

    if (!profileRows || profileRows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profileRows[0];
    res.json({
      name: profile.name,
      intro_body: profile.intro_body,
      sign_off: profile.sign_off,
      list_heading: profile.list_heading,
      updated_at: profile.updated_at,
      companies,
      contact_links: contacts
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const [categories]: any = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getItems(req: Request, res: Response) {
  try {
    const categorySlug = req.query.category as string | undefined;

    let projectSql = `
      SELECT p.id, p.slug, p.year, p.title, p.summary, p.live_url, 'project' as type,
             c.slug as category_slug,
             m.path as preview_path, m.alt as preview_alt, m.width as preview_width, m.height as preview_height
      FROM projects p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN media m ON p.preview_media_id = m.id
      WHERE p.status = 'published'
    `;
    const projectParams: any[] = [];

    if (categorySlug && categorySlug !== 'papers') {
      projectSql += ` AND c.slug = ?`;
      projectParams.push(categorySlug);
    }

    let articleSql = `
      SELECT a.id, a.slug, a.year, a.title, a.summary, NULL as live_url, 'article' as type,
             'papers' as category_slug,
             m.path as preview_path, m.alt as preview_alt, m.width as preview_width, m.height as preview_height
      FROM articles a
      LEFT JOIN media m ON a.preview_media_id = m.id
      WHERE a.status = 'published'
    `;

    let items: any[] = [];

    if (!categorySlug) {
      const [projects]: any = await pool.query(projectSql, projectParams);
      const [articles]: any = await pool.query(articleSql);
      items = [...projects, ...articles];
    } else if (categorySlug === 'papers') {
      const [articles]: any = await pool.query(articleSql);
      items = articles;
    } else {
      const [projects]: any = await pool.query(projectSql, projectParams);
      items = projects;
    }

    // Sort by year descending
    items.sort((a, b) => b.year - a.year);

    const formatted = items.map(item => ({
      id: item.id,
      slug: item.slug,
      year: item.year,
      title: item.title,
      summary: item.summary,
      type: item.type,
      category_slug: item.category_slug,
      href: item.type === 'article' ? `/papers/${item.slug}` : `/work/${item.slug}`,
      is_external: false,
      live_url: item.live_url,
      preview: item.preview_path ? {
        path: item.preview_path,
        alt: item.preview_alt,
        width: item.preview_width,
        height: item.preview_height
      } : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const [projects]: any = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             vm.path as video_path, vm.mime as video_mime,
             pm.path as poster_path, pm.alt as poster_alt,
             im.path as image_path, im.alt as image_alt, im.width as image_width, im.height as image_height
      FROM projects p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN media vm ON p.video_media_id = vm.id
      LEFT JOIN media pm ON p.poster_media_id = pm.id
      LEFT JOIN media im ON p.image_media_id = im.id
      WHERE p.slug = ? AND p.status = 'published'
      LIMIT 1
    `, [slug]);

    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[0];

    const [galleryRows]: any = await pool.query(`
      SELECT g.id, g.caption, g.sort_order,
             m.path, m.alt, m.width, m.height, m.kind
      FROM project_gallery g
      JOIN media m ON g.media_id = m.id
      WHERE g.project_id = ?
      ORDER BY g.sort_order ASC
    `, [project.id]);

    res.json({
      id: project.id,
      slug: project.slug,
      year: project.year,
      title: project.title,
      summary: project.summary,
      category: {
        name: project.category_name,
        slug: project.category_slug
      },
      live_url: project.live_url,
      live_label: project.live_label || 'view live project',
      primary_media_type: project.primary_media_type,
      video: project.video_path ? {
        path: project.video_path,
        mime: project.video_mime,
        poster_path: project.poster_path,
        poster_alt: project.poster_alt
      } : null,
      image: project.image_path ? {
        path: project.image_path,
        alt: project.image_alt,
        width: project.image_width,
        height: project.image_height
      } : null,
      paragraphs: [
        project.paragraph_1,
        project.paragraph_2,
        project.paragraph_3
      ],
      gallery: galleryRows.map((g: any) => ({
        id: g.id,
        path: g.path,
        alt: g.alt,
        width: g.width,
        height: g.height,
        caption: g.caption
      }))
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getArticleBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const [articles]: any = await pool.query(`
      SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1
    `, [slug]);

    if (!articles || articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articles[0];

    const [blocks]: any = await pool.query(`
      SELECT id, type, content, sort_order
      FROM article_blocks
      WHERE article_id = ?
      ORDER BY sort_order ASC
    `, [article.id]);

    res.json({
      id: article.id,
      slug: article.slug,
      year: article.year,
      published_at: article.published_at,
      title: article.title,
      summary: article.summary,
      blocks: blocks.map((b: any) => ({
        id: b.id,
        type: b.type,
        content: typeof b.content === 'string' ? JSON.parse(b.content) : b.content,
        sort_order: b.sort_order
      }))
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSitemapData(req: Request, res: Response) {
  try {
    const [projects]: any = await pool.query(`
      SELECT slug, updated_at, 'project' as type FROM projects WHERE status = 'published'
    `);
    const [articles]: any = await pool.query(`
      SELECT slug, updated_at, 'article' as type FROM articles WHERE status = 'published'
    `);

    res.json({
      items: [
        { path: '/', updated_at: new Date().toISOString() },
        ...projects.map((p: any) => ({ path: `/work/${p.slug}`, updated_at: p.updated_at })),
        ...articles.map((a: any) => ({ path: `/papers/${a.slug}`, updated_at: a.updated_at }))
      ]
    });
  } catch (error) {
    console.error('Error generating sitemap data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
