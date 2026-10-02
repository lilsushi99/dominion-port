import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface AppEnv {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  UPLOAD_DIR: string;
  PUBLIC_MEDIA_URL: string;
  SITE_URL: string;
  ADMIN_ORIGIN?: string;
  SESSION_COOKIE_DOMAIN?: string;
  REVALIDATE_SECRET: string;
}

function normalizeHost(val?: string): string {
  if (!val || val === 'dflamez_pls' || val === 'dflamez_erp' || val === 'localhost') {
    return '127.0.0.1';
  }
  return val;
}

function normalizePort(val?: string): number {
  const n = Number(val);
  return isNaN(n) || n <= 0 ? 3306 : n;
}

function normalizeUser(val?: string): string {
  if (!val || val === 'dflamez_pls' || val === 'dflamez_erp') {
    return 'root';
  }
  return val;
}

function normalizePassword(val?: string): string {
  if (val === 'dflamez_pls' || val === 'dflamez_erp') {
    return '';
  }
  return val || '';
}

function normalizeDbName(val?: string): string {
  if (!val || val === 'dflamez_pls' || val === 'dflamez_erp') {
    return 'dominion_portfolio';
  }
  return val;
}

/**
 * Validates required environment variables and fails fast on boot.
 */
export function validateEnv(): AppEnv {
  const uploadDir = (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR !== 'dflamez_erp')
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve('/tmp/dominion_uploads');

  // Ensure upload directory exists and is writable
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.accessSync(uploadDir, fs.constants.W_OK | fs.constants.R_OK);
  } catch (err) {
    console.error(`[FATAL] UPLOAD_DIR (${uploadDir}) is not accessible or writable:`, err);
    throw new Error(`UPLOAD_DIR (${uploadDir}) is not accessible or writable.`);
  }

  // Prevent storing uploads directly inside the git repo or deploy root in production
  const repoRoot = path.resolve(__dirname, '../../..');
  if (process.env.NODE_ENV === 'production' && uploadDir.startsWith(repoRoot)) {
    console.warn(`[WARNING] UPLOAD_DIR (${uploadDir}) is located within the application repository (${repoRoot}). In production on Hostinger, uploads must be placed outside the deployment folder to survive rebuilds.`);
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 4000,
    DB_HOST: normalizeHost(process.env.DB_HOST || process.env.DATABASE_HOST),
    DB_PORT: normalizePort(process.env.DB_PORT || process.env.DATABASE_PORT),
    DB_USER: normalizeUser(process.env.DB_USER || process.env.DATABASE_USER),
    DB_PASSWORD: normalizePassword(process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD),
    DB_NAME: normalizeDbName(process.env.DB_NAME || process.env.DATABASE_NAME),
    UPLOAD_DIR: uploadDir,
    PUBLIC_MEDIA_URL: process.env.PUBLIC_MEDIA_URL || '/media',
    SITE_URL: process.env.SITE_URL || 'http://localhost:3000',
    ADMIN_ORIGIN: process.env.ADMIN_ORIGIN || process.env.SITE_URL || 'http://localhost:3000',
    SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || 'dev-revalidate-secret-key'
  };
}

export const env = validateEnv();
