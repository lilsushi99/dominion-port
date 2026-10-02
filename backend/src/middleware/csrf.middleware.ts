// backend/src/middleware/csrf.middleware.ts — CSRF Protection Middleware
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { verifyCsrfToken } from '../services/auth.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Safe read methods do not modify state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // If request uses Bearer authorization header, CSRF via ambient cookies is mitigated
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const sessionToken = req.sessionToken || req.cookies?.dominion_session;
  const csrfToken = (req.headers['x-csrf-token'] as string) || (req.body?._csrf as string);

  if (!sessionToken || !csrfToken || !verifyCsrfToken(sessionToken, csrfToken)) {
    res.status(403).json({
      error: {
        code: 'CSRF_INVALID',
        message: 'Invalid or missing CSRF token. Please refresh and try again.'
      }
    });
    return;
  }

  next();
}
