// backend/src/routes/admin/auth.routes.ts — Admin Auth Endpoints
import { Router, Request, Response } from 'express';
import {
  validateCredentials,
  createSession,
  destroySession,
  generateCsrfToken,
  changePassword,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit
} from '../../services/auth.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { requireCsrf } from '../../middleware/csrf.middleware';
import { env } from '../../config/env';

export const authRouter = Router();

/**
 * POST /api/v1/admin/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!identifier || !password) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email or username and password are required.'
      }
    });
    return;
  }

  // Rate limit check: 5 attempts per 15 minutes
  const rateCheck = checkLoginRateLimit(identifier, ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: `Too many attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`
      }
    });
    return;
  }

  try {
    const user = await validateCredentials(identifier, password);
    if (!user) {
      recordFailedLoginAttempt(identifier, ip);
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: "Those details don't match."
        }
      });
      return;
    }

    // Clear failed attempts on success
    clearLoginRateLimit(identifier, ip);

    const userAgent = req.headers['user-agent'];
    const { token, expiresAt } = await createSession(user.id, ip, userAgent);
    const csrfToken = generateCsrfToken(token);

    // Set secure session cookie
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('dominion_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: expiresAt,
      domain: env.SESSION_COOKIE_DOMAIN || undefined,
      path: '/'
    });

    res.json({
      data: {
        user,
        csrfToken
      }
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected authentication error occurred.'
      }
    });
  }
});

/**
 * POST /api/v1/admin/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.dominion_session || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : '');

  if (token) {
    try {
      await destroySession(token);
    } catch (err) {
      console.error('[LOGOUT ERROR]', err);
    }
  }

  res.clearCookie('dominion_session', {
    httpOnly: true,
    sameSite: 'lax',
    domain: env.SESSION_COOKIE_DOMAIN || undefined,
    path: '/'
  });

  res.json({ data: { success: true } });
});

/**
 * GET /api/v1/admin/auth/me
 */
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const csrfToken = generateCsrfToken(req.sessionToken!);
  res.json({
    data: {
      user: req.user,
      csrfToken
    }
  });
});

/**
 * POST /api/v1/admin/auth/password
 */
authRouter.post('/password', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current password and new password are required.'
      }
    });
    return;
  }

  try {
    const result = await changePassword(req.user!.id, currentPassword, newPassword);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: result.error || 'Failed to update password.'
        }
      });
      return;
    }

    res.json({ data: { success: true, message: 'Password updated successfully.' } });
  } catch (err) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred while updating password.'
      }
    });
  }
});
