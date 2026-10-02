// app/api/v1/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/backend/src/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('dominion_session')?.value;
    if (token) {
      await destroySession(token);
    }

    const response = NextResponse.json({ data: { success: true } });
    response.cookies.delete('dominion_session');
    return response;
  } catch (error) {
    console.error('[API LOGOUT ERROR]', error);
    return NextResponse.json({ data: { success: true } });
  }
}
