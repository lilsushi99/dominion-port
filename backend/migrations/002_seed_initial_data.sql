-- 002_seed_initial_data.sql — Initial CMS content and portfolio seed matching PROJECT.md v2

-- 0. Admin User
INSERT INTO admin_users (id, email, username, password_hash)
VALUES (1, 'raycassxxx@gmail.com', 'raycass', '$2b$12$nX8vJEJee6t1qZtKO2fvLubksqCcNxFPkjkbrEfaR8B9meCc6dk/C')
ON DUPLICATE KEY UPDATE email = VALUES(email), username = VALUES(username), password_hash = VALUES(password_hash);

-- 1. Site Settings
INSERT INTO site_settings (id, projects_heading)
VALUES (1, 'p.s. things i\'ve made and written…')
ON DUPLICATE KEY UPDATE projects_heading = VALUES(projects_heading);

-- 2. Home Content (Rich Intro with tokens/links)
INSERT INTO home_content (id, body_json, body_html, sign_off)
VALUES (
  1,
  '{
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "hey, i\'m dominion. i design and build web software, design systems, and data tools. over the last eight years i have worked across "},
          {"type": "text", "marks": [{"type": "bold"}], "text": "product design"},
          {"type": "text", "text": ", "},
          {"type": "text", "marks": [{"type": "bold"}], "text": "full-stack web engineering"},
          {"type": "text", "text": ", and "},
          {"type": "text", "marks": [{"type": "bold"}], "text": "research analytics"},
          {"type": "text", "text": " with teams at "},
          {"type": "text", "marks": [{"type": "link", "attrs": {"href": "https://stripe.com", "target": "_blank"}}], "text": "stripe"},
          {"type": "text", "text": ", "},
          {"type": "text", "marks": [{"type": "link", "attrs": {"href": "https://vercel.com", "target": "_blank"}}], "text": "vercel"},
          {"type": "text", "text": ", and independent studios."}
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "i care deeply about typographic restraint, high-density interfaces, and robust software architecture. when i am not shipping web products or designing enterprise tools, i write technical papers exploring meteorological data models, carbon metrics, and business intelligence systems."}
        ]
      }
    ]
  }',
  '<p>hey, i\'m dominion. i design and build web software, design systems, and data tools. over the last eight years i have worked across <strong>product design</strong>, <strong>full-stack web engineering</strong>, and <strong>research analytics</strong> with teams at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">stripe</a>, <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel</a>, and independent studios.</p><p>i care deeply about typographic restraint, high-density interfaces, and robust software architecture. when i am not shipping web products or designing enterprise tools, i write technical papers exploring meteorological data models, carbon metrics, and business intelligence systems.</p>',
  'love,\ndominion'
)
ON DUPLICATE KEY UPDATE
  body_json = VALUES(body_json),
  body_html = VALUES(body_html),
  sign_off = VALUES(sign_off);

-- 3. CTA Links
DELETE FROM cta_links;
INSERT INTO cta_links (id, label, url, sort_order, is_active) VALUES
(1, 'email me', 'mailto:dominion@example.com', 1, 1),
(2, 'text me on linkedin', 'https://linkedin.com/in/dominion', 2, 1),
(3, 'whatsapp me', 'https://wa.me/1234567890', 3, 1),
(4, 'find me on x', 'https://x.com/dominion', 4, 1);

-- 4. Footer Settings
INSERT INTO footer_settings (id, year_mode, fixed_year, copyright_text, designed_by_text, designer_name, designer_url)
VALUES (1, 'fixed', 2026, '', 'Designed by', 'Castiel', 'https://dflamez.com.ng')
ON DUPLICATE KEY UPDATE 
  year_mode = VALUES(year_mode),
  fixed_year = VALUES(fixed_year),
  copyright_text = VALUES(copyright_text),
  designed_by_text = VALUES(designed_by_text),
  designer_name = VALUES(designer_name),
  designer_url = VALUES(designer_url);

-- 5. Categories
DELETE FROM categories;
INSERT INTO categories (id, slug, name, content_type, sort_order, is_active) VALUES
(1, 'web-development', 'web development', 'project', 1, 1),
(2, 'product-design', 'product design', 'project', 2, 1),
(3, 'dashboards', 'dashboards', 'project', 3, 1),
(4, 'papers', 'papers', 'paper', 4, 1);

-- 6. Media Seed Assets
DELETE FROM media;
INSERT INTO media (id, kind, original_name, stored_name, relative_path, mime, size_bytes, width, height, duration_s, alt) VALUES
(1, 'video', 'sample-video.mp4', 'sample-video.mp4', 'sample-video.mp4', 'video/mp4', 154820, 1280, 720, 4.0, 'Logistics routing platform video demonstration'),
(2, 'image', 'sample-poster.svg', 'sample-poster.svg', 'sample-poster.svg', 'image/svg+xml', 1240, 1200, 750, NULL, 'Logistics system preview visual'),
(3, 'image', 'sample-thumb.svg', 'sample-thumb.svg', 'sample-thumb.svg', 'image/svg+xml', 860, 120, 80, NULL, 'Interface thumbnail preview'),
(4, 'image', 'article-figure.svg', 'article-figure.svg', 'article-figure.svg', 'image/svg+xml', 1420, 1200, 680, NULL, 'Comparative model latency graph');

-- 7. Projects
DELETE FROM projects;
INSERT INTO projects (
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

-- 8. Project Gallery Items
DELETE FROM project_gallery;
INSERT INTO project_gallery (project_id, media_id, caption, sort_order) VALUES
(1, 2, 'Route recalculation under dynamic congestion conditions', 1),
(1, 4, 'Telemetry throughput vs dispatch reconciliation latency', 2),
(2, 2, 'Multi-location split inventory ledger interface', 1);

-- 9. Papers
DELETE FROM papers;
INSERT INTO papers (
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
  '{
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "Traditional supply chain planning models treat inventory volatility through deterministic moving averages or simple Gaussian distributions. However, real-world commerce disruptions exhibit non-linear cascading behaviors that bear striking mathematical resemblance to atmospheric turbulence and thermodynamic baroclinic instabilities."}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "1. Ensemble Modeling in Inventory Dynamics"}]
      },
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "In modern numerical weather prediction, forecasters never rely on a single deterministic trajectory. Instead, they run ensemble perturbations—fifty or more parallel integrations starting from slightly varied initial states. When applied to multi-tier enterprise inventories, ensemble simulation reveals hidden fragility points that classical single-point forecasting completely conceals."}
        ]
      },
      {
        "type": "quote",
        "attrs": {"attribution": "Dominion, Computational Logistics Review (2026)"},
        "content": [
          {"type": "text", "text": "Treating enterprise supply chains as fluid thermodynamic mediums yields predictive precision far superior to classical econometric linear models."}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "2. Empirical Latency and Convergence Rates"}]
      },
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "Our benchmarks across three enterprise networks showed that shifting from weekly batch MRP to streaming ensemble solvers reduced stockout incidents by 34% during volatile geopolitical tariff cycles."}
        ]
      }
    ]
  }',
  '<p>Traditional supply chain planning models treat inventory volatility through deterministic moving averages or simple Gaussian distributions. However, real-world commerce disruptions exhibit non-linear cascading behaviors that bear striking mathematical resemblance to atmospheric turbulence and thermodynamic baroclinic instabilities.</p><h2>1. Ensemble Modeling in Inventory Dynamics</h2><p>In modern numerical weather prediction, forecasters never rely on a single deterministic trajectory. Instead, they run ensemble perturbations—fifty or more parallel integrations starting from slightly varied initial states. When applied to multi-tier enterprise inventories, ensemble simulation reveals hidden fragility points that classical single-point forecasting completely conceals.</p><blockquote class="my-8 pl-4 border-l border-[#3a3a3a] text-[#d6d5cf] italic text-[16px] leading-[1.6]"><p>&ldquo;Treating enterprise supply chains as fluid thermodynamic mediums yields predictive precision far superior to classical econometric linear models.&rdquo;</p><footer class="text-[13px] text-[#75746f] not-italic mt-2">— Dominion, Computational Logistics Review (2026)</footer></blockquote><h2>2. Empirical Latency and Convergence Rates</h2><p>Our benchmarks across three enterprise networks showed that shifting from weekly batch MRP to streaming ensemble solvers reduced stockout incidents by 34% during volatile geopolitical tariff cycles.</p>',
  'published',
  '2026-02-28 12:00:00'
);

-- 10. Paper Media
DELETE FROM paper_media;
INSERT INTO paper_media (paper_id, media_id) VALUES
(1, 4);
