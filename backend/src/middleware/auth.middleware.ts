// backend/src/middleware/auth.middleware.ts — Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import { verifySession, AdminUser, SessionInfo } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: AdminUser;
  sessionInfo?: SessionInfo;
  sessionToken?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cookieToken = req.cookies?.dominion_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  
  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.'
      }
    });
    return;
  }

  try {
    const result = await verifySession(token);
    if (!result) {
      res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        }
      });
      return;
    }

    req.user = result.user;
    req.sessionInfo = result.session;
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE ERROR]', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal authentication verification error.'
      }
    });
  }
}
