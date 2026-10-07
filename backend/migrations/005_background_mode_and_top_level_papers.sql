-- 005_background_mode_and_top_level_papers.sql
-- 1) Admin-selectable public background (dark theme): 'off_black' (noise) or 'black' (#000000)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_mode VARCHAR(20) NOT NULL DEFAULT 'off_black';

-- 2) Papers are a top-level work type: no category required.
--    Papers, projects and media are NOT deleted. Only paper-type categories are removed.
ALTER TABLE papers MODIFY category_id INT NULL;
UPDATE papers SET category_id = NULL;
DELETE FROM categories WHERE content_type = 'paper';
