// backend/src/db/sqlite-engine.ts — Resilient Embedded SQL Engine with SQLite fallback
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import type { Database, SqlValue } from 'sql.js';
import { resolvePersistentStorageDir } from '../config/env';

function getNativeRequire() {
  try {
    return eval('require');
  } catch {
    const { createRequire } = require('module');
    return createRequire(process.cwd() + '/package.json');
  }
}

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;
let dbFilePath: string = '';

/**
 * Initializes the SQLite Database and runs all schema and initial seeds if not present.
 */
export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const req = getNativeRequire();
    const initSqlJs = req('sql.js');
    const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
    const SQL = await initSqlJs({
      locateFile: () => wasmPath
    });
    const storageDir = resolvePersistentStorageDir();
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    dbFilePath = path.join(storageDir, 'dominion_cms.sqlite');

    let db: Database;
    if (fs.existsSync(dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(dbFilePath);
        db = new SQL.Database(fileBuffer);
        console.log(`[SQLITE FALLBACK] Loaded existing database from ${dbFilePath}`);
      } catch (err) {
        console.warn(`[SQLITE FALLBACK] Corrupt database file, initializing fresh:`, err);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
      console.log(`[SQLITE FALLBACK] Initializing new embedded database at ${dbFilePath}`);
    }

    dbInstance = db;
    await initializeSchemaAndSeeds(db);
    persistDatabase();
    return db;
  })();

  return initPromise;
}

/**
 * Saves in-memory SQLite state to persistent file.
 */
export function persistDatabase(): void {
  if (!dbInstance || !dbFilePath) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error(`[SQLITE FALLBACK] Failed to persist database to ${dbFilePath}:`, err);
  }
}

/**
 * Creates initial schema and seeds initial data.
 */
async function initializeSchemaAndSeeds(db: Database) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      ip TEXT NULL,
      user_agent TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY,
      projects_heading TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS home_content (
      id INTEGER PRIMARY KEY,
      body_json TEXT NOT NULL,
      body_html TEXT NOT NULL,
      sign_off TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cta_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS footer_settings (
      id INTEGER PRIMARY KEY,
      year_mode TEXT NOT NULL DEFAULT 'auto',
      fixed_year INTEGER NULL,
      copyright_text TEXT NOT NULL,
      designed_by_text TEXT NOT NULL,
      designer_name TEXT NOT NULL,
      designer_url TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'project',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL UNIQUE,
      relative_path TEXT NOT NULL,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER NULL,
      height INTEGER NULL,
      duration_s REAL NULL,
      alt TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      pub_year INTEGER NOT NULL,
      pub_month INTEGER NULL,
      pub_day INTEGER NULL,
      category_id INTEGER NOT NULL,
      primary_media_id INTEGER NULL,
      poster_media_id INTEGER NULL,
      project_url TEXT NULL,
      link_label TEXT NULL,
      summary TEXT NOT NULL,
      paragraph_1 TEXT NOT NULL,
      paragraph_2 TEXT NOT NULL,
      paragraph_3 TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sort_order INTEGER NOT NULL DEFAULT 0,
      published_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      caption TEXT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      pub_year INTEGER NOT NULL,
      pub_month INTEGER NULL,
      pub_day INTEGER NULL,
      category_id INTEGER NOT NULL,
      summary TEXT NULL,
      cover_media_id INTEGER NULL,
      content_json TEXT NOT NULL,
      content_html TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paper_media (
      paper_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      PRIMARY KEY (paper_id, media_id)
    );

    CREATE TABLE IF NOT EXISTS slug_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profile_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if admin user exists, if not seed all default data
  const checkAdmin = db.exec('SELECT COUNT(*) as cnt FROM admin_users');
  const count = checkAdmin[0]?.values[0]?.[0] as number;
  if (!count || count === 0) {
    console.log('[SQLITE FALLBACK] Seeding initial CMS and admin portfolio data...');
    // Seed admin
    db.run(
      `INSERT OR REPLACE INTO admin_users (id, email, username, password_hash)
       VALUES (1, 'raycassxxx@gmail.com', 'raycass', '$2b$12$nX8vJEJee6t1qZtKO2fvLubksqCcNxFPkjkbrEfaR8B9meCc6dk/C');`
    );

    // Site settings
    db.run(
      `INSERT OR REPLACE INTO site_settings (id, projects_heading)
       VALUES (1, 'p.s. things i''ve made and written…');`
    );

    // Home content
    const introJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: "hey, i'm dominion. i design and build web software, design systems, and data tools. over the last eight years i have worked across " },
            { type: 'text', marks: [{ type: 'bold' }], text: 'product design' },
            { type: 'text', text: ', ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'full-stack web engineering' },
            { type: 'text', text: ', and ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'research analytics' },
            { type: 'text', text: ' with teams at ' },
            { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://stripe.com', target: '_blank' } }], text: 'stripe' },
            { type: 'text', text: ', ' },
            { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://vercel.com', target: '_blank' } }], text: 'vercel' },
            { type: 'text', text: ', and independent studios.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'i care deeply about typographic restraint, high-density interfaces, and robust software architecture. when i am not shipping web products or designing enterprise tools, i write technical papers exploring meteorological data models, carbon metrics, and business intelligence systems.' }
          ]
        }
      ]
    });
    const introHtml = '<p>hey, i\'m dominion. i design and build web software, design systems, and data tools. over the last eight years i have worked across <strong>product design</strong>, <strong>full-stack web engineering</strong>, and <strong>research analytics</strong> with teams at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">stripe</a>, <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel</a>, and independent studios.</p><p>i care deeply about typographic restraint, high-density interfaces, and robust software architecture. when i am not shipping web products or designing enterprise tools, i write technical papers exploring meteorological data models, carbon metrics, and business intelligence systems.</p>';
    
    db.run(
      `INSERT OR REPLACE INTO home_content (id, body_json, body_html, sign_off)
       VALUES (1, ?, ?, ?);`,
      [introJson, introHtml, 'love,\ndominion']
    );

    // CTA links
    db.run(`
      INSERT OR REPLACE INTO cta_links (id, label, url, sort_order, is_active) VALUES
      (1, 'email me', 'mailto:dominion@example.com', 1, 1),
      (2, 'text me on linkedin', 'https://linkedin.com/in/dominion', 2, 1),
      (3, 'whatsapp me', 'https://wa.me/1234567890', 3, 1),
      (4, 'find me on x', 'https://x.com/dominion', 4, 1);
    `);

    // Footer settings
    db.run(`
      INSERT OR REPLACE INTO footer_settings (id, year_mode, fixed_year, copyright_text, designed_by_text, designer_name, designer_url)
      VALUES (1, 'fixed', 2026, '', 'Designed by', 'Castiel', 'https://dflamez.com.ng');
    `);

    // Categories
    db.run(`
      INSERT OR REPLACE INTO categories (id, slug, name, content_type, sort_order, is_active) VALUES
      (1, 'web-development', 'web development', 'project', 1, 1),
      (2, 'product-design', 'product design', 'project', 2, 1),
      (3, 'dashboards', 'dashboards', 'project', 3, 1),
      (4, 'papers', 'papers', 'paper', 4, 1);
    `);

    // Media Seed Assets
    db.run(`
      INSERT OR REPLACE INTO media (id, kind, original_name, stored_name, relative_path, mime, size_bytes, width, height, duration_s, alt) VALUES
      (1, 'video', 'sample-video.mp4', 'sample-video.mp4', 'sample-video.mp4', 'video/mp4', 154820, 1280, 720, 4.0, 'Logistics routing platform video demonstration'),
      (2, 'image', 'sample-poster.svg', 'sample-poster.svg', 'sample-poster.svg', 'image/svg+xml', 1240, 1200, 750, NULL, 'Logistics system preview visual'),
      (3, 'image', 'sample-thumb.svg', 'sample-thumb.svg', 'sample-thumb.svg', 'image/svg+xml', 860, 120, 80, NULL, 'Interface thumbnail preview'),
      (4, 'image', 'article-figure.svg', 'article-figure.svg', 'article-figure.svg', 'image/svg+xml', 1420, 1200, 680, NULL, 'Comparative model latency graph');
    `);

    // Projects
    db.run(`
      INSERT OR REPLACE INTO projects (
        id, slug, title, pub_year, pub_month, pub_day, category_id,
        primary_media_id, poster_media_id, project_url, link_label, summary,
        paragraph_1, paragraph_2, paragraph_3, status, sort_order, published_at
      ) VALUES
      (
        1,
        'northwind-logistics',
        'Northwind Logistics Engine',
        2026, 1, 15, 1,
        1, 2,
        'https://github.com/dominion/northwind-engine',
        'view live project',
        'Real-time fleet telemetry pipeline and route optimization engine processing high-throughput sensor telemetry.',
        'Northwind Logistics was conceived as a high-density operations center for national distribution fleets. The core dispatching problem required processing over 40,000 live GPS and telemetry pings per second while dynamically rebalancing delivery slots against unpredictable weather delays and traffic incidents.',
        'We engineered a tailored distributed pipeline using event streams and web-first geospatial visualization. Rather than relying on heavyweight GIS bloat, the mapping canvas was built using specialized WebGL rendering layers that render multi-tier delivery routes at a steady 60 frames per second on commodity warehouse hardware.',
        'The final deployment decreased dispatch reconciliation time by 42% across regional transport hubs. Automated exception reporting pinpointed maintenance issues before engine failures occurred, demonstrating that restrained visual design and relentless software optimization produce transformative operational gains.',
        'published',
        1,
        '2026-01-15 10:00:00'
      ),
      (
        2,
        'meridian-erp',
        'Meridian POS & Inventory Matrix',
        2025, 11, 20, 2,
        2, NULL,
        'https://meridian-demo.dominion.design',
        'view live demo',
        'End-to-end multi-warehouse inventory matrix and omnichannel point-of-sale platform.',
        'Meridian was commissioned to solve severe inventory drift across twenty-eight physical retail outlets and three centralized distribution hubs. Traditional retail software was fragmented into slow desktop clients that failed to synchronize during flash sales and peak shopping holidays.',
        'We designed an offline-tolerant architecture with deterministic conflict resolution. Staff can scan barcodes, issue split payments, and process returns even during intermittent network drops, with instantaneous background reconciliation once connectivity is restored.',
        'Over an eight-month trial period, inventory discrepancies dropped below 0.05%, while average checkout latency fell to under four seconds per transaction.',
        'published',
        2,
        '2025-11-20 09:30:00'
      ),
      (
        3,
        'climate-telemetry-dashboard',
        'Helios Atmospheric Climate Telemetry',
        2025, 6, 10, 3,
        2, NULL,
        'https://helios-climate.dominion.design',
        'view climate telemetry',
        'Sub-second telemetry matrix visualizing regional atmospheric pressure gradients and solar flux.',
        'Helios provides planetary scientists and renewable energy operators with immediate access to ground sensor arrays and orbital radiometer datasets. The goal was to eliminate sluggish batch exports in favor of instant visual query exploration.',
        'We built specialized WebGL rasterization shaders capable of streaming continuous multi-spectral heatmaps across variable geographic projections without taxing client CPU resources.',
        'The resulting tool was adopted by over twelve environmental research consortiums to track microclimate shifts and predict wind turbine yield variations with unprecedented accuracy.',
        'published',
        3,
        '2025-06-10 14:00:00'
      );
    `);

    // Project Gallery
    db.run(`
      INSERT OR REPLACE INTO project_gallery (id, project_id, media_id, caption, sort_order) VALUES
      (1, 1, 2, 'Route recalculation under dynamic congestion conditions', 1),
      (2, 1, 4, 'Telemetry throughput vs dispatch reconciliation latency', 2),
      (3, 2, 2, 'Multi-location split inventory ledger interface', 1);
    `);

    // Papers
    const paperJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Traditional supply chain planning models treat inventory volatility through deterministic moving averages or simple Gaussian distributions. However, real-world commerce disruptions exhibit non-linear cascading behaviors that bear striking mathematical resemblance to atmospheric turbulence and thermodynamic baroclinic instabilities.' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Ensemble Modeling in Inventory Dynamics' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'In modern numerical weather prediction, forecasters never rely on a single deterministic trajectory. Instead, they run ensemble perturbations—fifty or more parallel integrations starting from slightly varied initial states. When applied to multi-tier enterprise inventories, ensemble simulation reveals hidden fragility points that classical single-point forecasting completely conceals.' }
          ]
        },
        {
          type: 'quote',
          attrs: { attribution: 'Dominion, Computational Logistics Review (2026)' },
          content: [
            { type: 'text', text: 'Treating enterprise supply chains as fluid thermodynamic mediums yields predictive precision far superior to classical econometric linear models.' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Empirical Latency and Convergence Rates' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Our benchmarks across three enterprise networks showed that shifting from weekly batch MRP to streaming ensemble solvers reduced stockout incidents by 34% during volatile geopolitical tariff cycles.' }
          ]
        }
      ]
    });
    const paperHtml = '<p>Traditional supply chain planning models treat inventory volatility through deterministic moving averages or simple Gaussian distributions. However, real-world commerce disruptions exhibit non-linear cascading behaviors that bear striking mathematical resemblance to atmospheric turbulence and thermodynamic baroclinic instabilities.</p><h2>1. Ensemble Modeling in Inventory Dynamics</h2><p>In modern numerical weather prediction, forecasters never rely on a single deterministic trajectory. Instead, they run ensemble perturbations—fifty or more parallel integrations starting from slightly varied initial states. When applied to multi-tier enterprise inventories, ensemble simulation reveals hidden fragility points that classical single-point forecasting completely conceals.</p><blockquote class="my-8 pl-4 border-l border-[#3a3a3a] text-[#d6d5cf] italic text-[16px] leading-[1.6]"><p>&ldquo;Treating enterprise supply chains as fluid thermodynamic mediums yields predictive precision far superior to classical econometric linear models.&rdquo;</p><footer class="text-[13px] text-[#75746f] not-italic mt-2">— Dominion, Computational Logistics Review (2026)</footer></blockquote><h2>2. Empirical Latency and Convergence Rates</h2><p>Our benchmarks across three enterprise networks showed that shifting from weekly batch MRP to streaming ensemble solvers reduced stockout incidents by 34% during volatile geopolitical tariff cycles.</p>';

    db.run(
      `INSERT OR REPLACE INTO papers (
        id, slug, title, pub_year, pub_month, pub_day, category_id, summary, cover_media_id,
        content_json, content_html, status, published_at
      ) VALUES
      (
        1,
        'meteorological-models-to-business-intelligence',
        'From Numerical Weather Prediction to High-Frequency Enterprise Planning',
        2026, 2, 28, 4,
        'An investigation into applying thermodynamic atmospheric simulation paradigms to supply chain inventory volatility.',
        4,
        ?,
        ?,
        'published',
        '2026-02-28 12:00:00'
      );`,
      [paperJson, paperHtml]
    );

    // Paper media
    db.run(`
      INSERT OR REPLACE INTO paper_media (paper_id, media_id) VALUES (1, 4);
    `);
  }
}

/**
 * Normalizes SQL queries and executes them on SQLite, returning mysql2 formatted [rows, fields].
 */
export async function executeSqliteQuery(sql: string, params: any[] = []): Promise<[any, any]> {
  const db = await getSqliteDb();
  let normalizedSql = sql.trim();
  const isMutation = /^(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP)/i.test(normalizedSql);

  // Handle MySQL bulk insert syntax: INSERT INTO table (cols) VALUES ?
  if (params.length === 1 && Array.isArray(params[0]) && Array.isArray(params[0][0]) && normalizedSql.includes('VALUES ?')) {
    const rows = params[0] as any[][];
    if (rows.length === 0) {
      return [{ affectedRows: 0, insertId: 0 }, []];
    }
    const placeholders = rows.map((r) => `(${r.map(() => '?').join(', ')})`).join(', ');
    normalizedSql = normalizedSql.replace('VALUES ?', `VALUES ${placeholders}`);
    params = rows.flat();
  }

  // Handle ON DUPLICATE KEY UPDATE for simple single key or replace
  if (/INSERT INTO ([a-z0-9_]+) .* ON DUPLICATE KEY UPDATE/i.test(normalizedSql)) {
    // Convert to INSERT OR REPLACE INTO or ON CONFLICT
    normalizedSql = normalizedSql
      .replace(/INSERT INTO/i, 'INSERT OR REPLACE INTO')
      .replace(/ON DUPLICATE KEY UPDATE[\s\S]*/i, '');
  }

  // Handle INSERT IGNORE
  if (/INSERT IGNORE INTO/i.test(normalizedSql)) {
    normalizedSql = normalizedSql.replace(/INSERT IGNORE INTO/i, 'INSERT OR IGNORE INTO');
  }

  // Handle MySQL functions (NOW(), RAND())
  normalizedSql = normalizedSql
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bRAND\(\)/gi, 'RANDOM()');

  // Flatten nested objects/booleans in params
  const cleanParams: SqlValue[] = [];
  for (const p of params) {
    if (p === undefined || p === null) {
      cleanParams.push(null);
    } else if (typeof p === 'boolean') {
      cleanParams.push(p ? 1 : 0);
    } else if (p instanceof Date) {
      cleanParams.push(p.toISOString().slice(0, 19).replace('T', ' '));
    } else if (typeof p === 'object') {
      cleanParams.push(JSON.stringify(p));
    } else {
      cleanParams.push(p);
    }
  }

  try {
    if (isMutation) {
      db.run(normalizedSql, cleanParams);
      persistDatabase();

      // Retrieve insertId and affected rows
      const idRes = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
      const insertId = idRes[0]?.values[0]?.[0] as number || 0;
      const affectedRows = idRes[0]?.values[0]?.[1] as number || 0;

      const result = {
        insertId,
        affectedRows,
        changedRows: affectedRows,
        warningStatus: 0
      };
      return [result, []];
    }

    // SELECT query
    const stmt = db.prepare(normalizedSql);
    if (cleanParams.length > 0) {
      stmt.bind(cleanParams);
    }

    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    return [rows, []];
  } catch (err) {
    console.error(`[SQLITE FALLBACK QUERY ERROR] SQL: ${normalizedSql} Params:`, cleanParams, err);
    throw err;
  }
}
