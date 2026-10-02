// app/api/v1/admin/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, generateCsrfToken } from '@/backend/src/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const cookieToken = req.cookies.get('dominion_session')?.value;
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const result = await verifySession(token);
    if (!result) {
      return NextResponse.json(
        { error: { code: 'SESSION_EXPIRED', message: 'Your session has expired.' } },
        { status: 401 }
      );
    }

    const csrfToken = generateCsrfToken(token);
    return NextResponse.json({
      data: {
        user: result.user,
        csrfToken
      }
    });
  } catch (error) {
    console.error('[API ME ERROR]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected authentication error occurred.' } },
      { status: 500 }
    );
  }
}
