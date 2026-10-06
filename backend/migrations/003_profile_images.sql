-- 003_profile_images.sql — Profile pictures table for hero intro section
CREATE TABLE IF NOT EXISTS profile_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  media_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
