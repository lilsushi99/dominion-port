// app/api/v1/projects/route.ts — Public Published Projects List
import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/backend/src/services/projects.service';

export async function GET(req: NextRequest) {
  try {
    const categorySlug = req.nextUrl.searchParams.get('c') || req.nextUrl.searchParams.get('category') || undefined;

    const projects = await listProjects({
      categorySlug,
      status: 'published',
      includeDrafts: false
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('[API GET PROJECTS ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch projects.' } }, { status: 500 });
  }
}
