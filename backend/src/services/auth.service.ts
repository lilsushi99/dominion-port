// backend/src/services/auth.service.ts — Authentication and Session Logic
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { env } from '../config/env';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  created_at: string;
  last_login_at: string | null;
}

export interface SessionInfo {
  id: number;
  user_id: number;
  expires_at: Date;
  ip: string | null;
  user_agent: string | null;
}

// In-memory rate limiter for login attempts (5 attempts per 15 minutes per IP/Account)
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export function checkLoginRateLimit(identifier: string, ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const key = `${ip}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    return { allowed: true };
  }

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(key);
    return { allowed: true };
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(identifier: string, ip: string): void {
  const key = `${ip}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

export function clearLoginRateLimit(identifier: string, ip: string): void {
  const key = `${ip}:${identifier.toLowerCase().trim()}`;
  rateLimitMap.delete(key);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateCsrfToken(sessionToken: string): string {
  return crypto
    .createHmac('sha256', env.REVALIDATE_SECRET || 'dominion-csrf-secret')
    .update(sessionToken)
    .digest('hex');
}

export function verifyCsrfToken(sessionToken: string, csrfToken: string): boolean {
  if (!sessionToken || !csrfToken) return false;
  const expected = generateCsrfToken(sessionToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(csrfToken));
  } catch {
    return false;
  }
}

/**
 * Validates admin credentials against MySQL admin_users table.
 */
export async function validateCredentials(
  identifier: string,
  plainPassword: string
): Promise<AdminUser | null> {
  const trimmed = identifier.trim();
  const [rows] = await pool.query<any[]>(
    'SELECT id, email, username, password_hash, created_at, last_login_at FROM admin_users WHERE email = ? OR username = ? LIMIT 1',
    [trimmed, trimmed]
  );

  if (!rows || rows.length === 0) {
    // Run dummy compare to prevent timing side-channels
    await bcrypt.compare(plainPassword, '$2a$12$e8Y9zC3dGf.invalid.placeholder.hash.timing.mitigation');
    return null;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(plainPassword, user.password_hash);
  if (!isMatch) {
    return null;
  }

  // Update last_login_at
  await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [user.id]);

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    created_at: user.created_at,
    last_login_at: user.last_login_at
  };
}

/**
 * Creates a new server-side session in MySQL.
 */
export async function createSession(
  userId: number,
  ip?: string | null,
  userAgent?: string | null
): Promise<{ token: string; expiresAt: Date }> {
  // Generate random 32-byte session token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, ip || null, userAgent ? userAgent.substring(0, 500) : null]
  );

  return { token, expiresAt };
}

/**
 * Verifies session token from cookie/header.
 */
export async function verifySession(token: string): Promise<{ user: AdminUser; session: SessionInfo } | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);

  const [rows] = await pool.query<any[]>(
    `SELECT s.id as session_id, s.user_id, s.expires_at, s.ip, s.user_agent,
            u.id as user_id, u.email, u.username, u.created_at, u.last_login_at
     FROM sessions s
     INNER JOIN admin_users u ON s.user_id = u.id
     WHERE s.token_hash = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const r = rows[0];
  return {
    user: {
      id: r.user_id,
      email: r.email,
      username: r.username,
      created_at: r.created_at,
      last_login_at: r.last_login_at
    },
    session: {
      id: r.session_id,
      user_id: r.user_id,
      expires_at: new Date(r.expires_at),
      ip: r.ip,
      user_agent: r.user_agent
    }
  };
}

/**
 * Invalidates/destroys a session on logout.
 */
export async function destroySession(token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashToken(token);
  const [result] = await pool.query<any>('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  return result.affectedRows > 0;
}

/**
 * Changes an admin user's password.
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  const [rows] = await pool.query<any[]>(
    'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (!rows || rows.length === 0) {
    return { success: false, error: 'User not found.' };
  }

  const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!isMatch) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const salt = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(newPassword, salt);

  await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, userId]);

  return { success: true };
}
