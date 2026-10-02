// lib/auth/admin-auth-helper.ts — Common Next.js API Auth Helper
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, verifyCsrfToken, AdminUser } from '@/backend/src/services/auth.service';

export interface AuthContext {
  user: AdminUser;
  token: string;
  isBearer: boolean;
}

export async function authenticateAdmin(req: NextRequest): Promise<{ auth?: AuthContext; errorResponse?: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const cookieToken = req.cookies.get('dominion_session')?.value;
  const token = cookieToken || bearerToken;

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' } },
        { status: 401 }
      )
    };
  }

  const result = await verifySession(token);
  if (!result) {
    return {
      errorResponse: NextResponse.json(
        { error: { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please log in again.' } },
        { status: 401 }
      )
    };
  }

  return {
    auth: {
      user: result.user,
      token,
      isBearer: Boolean(bearerToken)
    }
  };
}

export function validateCsrf(req: NextRequest, auth: AuthContext): NextResponse | null {
  if (auth.isBearer) return null; // Bearer tokens are exempt from CSRF
  const csrfHeader = req.headers.get('x-csrf-token') || '';
  if (!verifyCsrfToken(auth.token, csrfHeader)) {
    return NextResponse.json(
      { error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token.' } },
      { status: 403 }
    );
  }
  return null;
}
