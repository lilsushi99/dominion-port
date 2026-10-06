-- 004_cta_links_and_papers.sql — Contact links presentation fields and paper categories
ALTER TABLE cta_links ADD COLUMN IF NOT EXISTS presentation_mode VARCHAR(20) NOT NULL DEFAULT 'text';
ALTER TABLE cta_links ADD COLUMN IF NOT EXISTS platform VARCHAR(50) NULL;

-- Insert paper subcategories if not existing
INSERT INTO categories (slug, name, content_type, sort_order, is_active)
VALUES 
  ('academic-papers', 'academic papers', 'paper', 1, 1),
  ('tech-papers', 'tech papers', 'paper', 2, 1),
  ('research-papers', 'research papers', 'paper', 3, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), content_type = VALUES(content_type);
