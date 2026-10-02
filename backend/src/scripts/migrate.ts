// backend/src/scripts/migrate.ts — Idempotent migration runner
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';

async function runMigrations() {
  console.log(`[MIGRATION] Connecting to MySQL at ${env.DB_HOST}:${env.DB_PORT}...`);

  // Initial connection to ensure target database exists
  const rootConn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });

  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await rootConn.end();

  // Connect to target database
  const db = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  console.log(`[MIGRATION] Target database '${env.DB_NAME}' ready.`);

  // Ensure migrations tracking table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Fetch already executed migrations
  const [rows] = await db.query<any[]>('SELECT name FROM migrations ORDER BY id ASC');
  const executedMigrationNames = new Set(rows.map((r: any) => r.name));

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error(`[MIGRATION] Migrations directory not found at: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let executedCount = 0;

  for (const file of files) {
    if (executedMigrationNames.has(file)) {
      console.log(`[MIGRATION] [SKIP] ${file} (already executed)`);
      continue;
    }

    console.log(`[MIGRATION] [RUN]  ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await db.query(sql);
      await db.query('INSERT INTO migrations (name) VALUES (?)', [file]);
      console.log(`[MIGRATION] [DONE] ${file} executed successfully.`);
      executedCount++;
    } catch (err) {
      console.error(`[MIGRATION] [ERROR] Failed executing ${file}:`, err);
      await db.end();
      process.exit(1);
    }
  }

  console.log(`[MIGRATION] Complete. ${executedCount} new migration(s) applied.`);
  await db.end();
}

runMigrations().catch((err) => {
  console.error('[MIGRATION] Uncaught error:', err);
  process.exit(1);
});
