// app/api/v1/admin/auth/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, verifyCsrfToken, changePassword } from '@/backend/src/services/auth.service';

export async function POST(req: NextRequest) {
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

    const csrfHeader = req.headers.get('x-csrf-token') || '';
    if (!bearerToken && !verifyCsrfToken(token, csrfHeader)) {
      return NextResponse.json(
        { error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token.' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Current and new password are required.' } },
        { status: 400 }
      );
    }

    const changeResult = await changePassword(result.user.id, currentPassword, newPassword);
    if (!changeResult.success) {
      return NextResponse.json(
        { error: { code: 'PASSWORD_CHANGE_FAILED', message: changeResult.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: { success: true, message: 'Password updated successfully.' }
    });
  } catch (error) {
    console.error('[API PASSWORD ERROR]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An error occurred while updating password.' } },
      { status: 500 }
    );
  }
}
