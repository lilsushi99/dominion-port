// app/api/v1/profile/route.ts — Public Profile Data
import { NextResponse } from 'next/server';
import { getPublicProfile } from '@/backend/src/services/cms.service';

export async function GET() {
  try {
    const profile = await getPublicProfile();
    return NextResponse.json({ data: profile });
  } catch (error: any) {
    console.error('[API GET PROFILE ERROR]', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error?.message || 'Failed to load profile data.' } },
      { status: 500 }
    );
  }
}
