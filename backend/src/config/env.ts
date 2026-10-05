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
  MEDIA_STORAGE_DIR: string;
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
 * Resolves the persistent media storage directory without making assumptions.
 * Guaranteed to point outside deployment-managed transient directories (hbuilds/public_html).
 */
export function resolvePersistentStorageDir(): string {
  // 1. Explicit environment variable (Highest Priority)
  const envDir = process.env.MEDIA_STORAGE_DIR || process.env.UPLOAD_DIR;
  if (envDir && envDir !== 'dflamez_erp' && envDir.trim() !== '') {
    return path.resolve(envDir.trim());
  }

  const cwd = process.cwd();

  // 2. Locate parent domain/user root outside hbuilds if cwd is inside hbuilds
  const hbuildsIndex = cwd.indexOf('/hbuilds');
  if (hbuildsIndex !== -1) {
    const parentRoot = cwd.slice(0, hbuildsIndex);
    return path.join(parentRoot, 'media_uploads');
  }

  // 3. Locate parent domain/user root outside public_html if cwd is inside public_html
  const publicHtmlIndex = cwd.indexOf('/public_html');
  if (publicHtmlIndex !== -1) {
    const parentRoot = cwd.slice(0, publicHtmlIndex);
    return path.join(parentRoot, 'media_uploads');
  }

  // 4. Hostinger multi-domain structure (/home/username/domains/domain.com/...)
  const domainsIndex = cwd.indexOf('/domains/');
  if (domainsIndex !== -1) {
    const afterDomains = cwd.slice(domainsIndex + '/domains/'.length);
    const domainName = afterDomains.split('/')[0];
    const userHome = cwd.slice(0, domainsIndex);
    const domainRoot = path.join(userHome, 'domains', domainName);
    return path.join(domainRoot, 'media_uploads');
  }

  // 5. Hostinger / Linux VPS user home directory
  if (process.env.HOME && process.env.HOME.startsWith('/home/')) {
    return path.join(process.env.HOME, 'media_uploads');
  }

  // 6. Safe fallback for Local Development / Container (sibling to project directory)
  return path.resolve(cwd, '../persistent_media_uploads');
}

/**
 * Validates required environment variables and fails fast on boot.
 */
export function validateEnv(): AppEnv {
  const uploadDir = resolvePersistentStorageDir();

  // Ensure persistent upload directory exists and is writable
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.accessSync(uploadDir, fs.constants.W_OK | fs.constants.R_OK);
  } catch (err) {
    console.error(`[FATAL] Persistent Media Storage (${uploadDir}) is not accessible or writable:`, err);
    throw new Error(`Persistent Media Storage (${uploadDir}) is not accessible or writable.`);
  }

  // Emit runtime diagnostic in logs
  const isInsideHbuilds = uploadDir.includes('/hbuilds') || uploadDir.includes('\\hbuilds');
  const isInsidePublicHtml = uploadDir.includes('/public_html') || uploadDir.includes('\\public_html');

  if (isInsideHbuilds || isInsidePublicHtml) {
    console.warn(
      `[HOSTINGER STORAGE WARNING] Your media storage directory (${uploadDir}) is inside a deployment-managed directory. To survive Git rebuilds, configure MEDIA_STORAGE_DIR in your .env or Hostinger environment to a path outside hbuilds/public_html.`
    );
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
    MEDIA_STORAGE_DIR: uploadDir,
    PUBLIC_MEDIA_URL: process.env.PUBLIC_MEDIA_URL || '/media',
    SITE_URL: process.env.SITE_URL || 'http://localhost:3000',
    ADMIN_ORIGIN: process.env.ADMIN_ORIGIN || process.env.SITE_URL || 'http://localhost:3000',
    SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || 'dev-revalidate-secret-key'
  };
}

export const env = validateEnv();
