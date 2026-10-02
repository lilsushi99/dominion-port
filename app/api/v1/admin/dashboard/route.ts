// app/api/v1/admin/dashboard/route.ts — Admin Dashboard Stats API
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-auth-helper';
import { getDashboardStats } from '@/backend/src/services/dashboard.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('[API DASHBOARD STATS ERROR]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard statistics.' } },
      { status: 500 }
    );
  }
}
