// app/api/v1/projects/[slug]/route.ts — Public Single Project by Slug (with 301 history support)
import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/backend/src/services/projects.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await getProjectBySlug(slug);

    if (result.redirectSlug) {
      return NextResponse.json({
        redirect: true,
        redirectSlug: result.redirectSlug,
        destinationUrl: `/work/${result.redirectSlug}`
      }, { status: 301 });
    }

    if (!result.project || result.project.status !== 'published') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: result.project });
  } catch (error) {
    console.error('[API GET PROJECT BY SLUG ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch project.' } }, { status: 500 });
  }
}
