// app/api/v1/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  validateCredentials,
  createSession,
  generateCsrfToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit
} from '@/backend/src/services/auth.service';
import { env } from '@/backend/src/config/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!identifier || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email or username and password are required.' } },
        { status: 400 }
      );
    }

    const rateCheck = checkLoginRateLimit(identifier, ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: `Too many attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`
          }
        },
        { status: 429 }
      );
    }

    const user = await validateCredentials(identifier, password);
    if (!user) {
      recordFailedLoginAttempt(identifier, ip);
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: "Those details don't match." } },
        { status: 401 }
      );
    }

    clearLoginRateLimit(identifier, ip);

    const userAgent = req.headers.get('user-agent');
    const { token, expiresAt } = await createSession(user.id, ip, userAgent);
    const csrfToken = generateCsrfToken(token);

    const response = NextResponse.json({
      data: {
        user,
        csrfToken
      }
    });

    const isProduction = env.NODE_ENV === 'production';
    response.cookies.set('dominion_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('[API LOGIN ERROR]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected authentication error occurred.' } },
      { status: 500 }
    );
  }
}
