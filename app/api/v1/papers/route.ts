// app/api/v1/papers/route.ts — Public Papers List API
import { NextRequest, NextResponse } from 'next/server';
import { listPapers } from '@/backend/src/services/papers.service';

export async function GET(req: NextRequest) {
  try {
    const categorySlug = req.nextUrl.searchParams.get('category') || undefined;

    const papers = await listPapers({
      categorySlug,
      status: 'published',
      includeDrafts: false
    });

    return NextResponse.json({ data: papers });
  } catch (error) {
    console.error('[API GET PAPERS ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch papers.' } }, { status: 500 });
  }
}
