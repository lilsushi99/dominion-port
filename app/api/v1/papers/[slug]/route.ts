// app/api/v1/papers/[slug]/route.ts — Public Paper by Slug (with 301 History Check)
import { NextRequest, NextResponse } from 'next/server';
import { getPaperBySlug } from '@/backend/src/services/papers.service';
import { findCurrentSlug } from '@/backend/src/services/slug.service';

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { slug } = await params;
    const paper = await getPaperBySlug(slug);

    if (paper && paper.status === 'published') {
      return NextResponse.json({ data: paper });
    }

    // Check 301 redirect history
    const redirectSlug = await findCurrentSlug('paper', slug);
    if (redirectSlug && redirectSlug !== slug) {
      return NextResponse.json(
        { data: null, redirect_url: `/papers/${redirectSlug}` },
        { status: 301, headers: { Location: `/papers/${redirectSlug}` } }
      );
    }

    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Paper not found.' } }, { status: 404 });
  } catch (error) {
    console.error('[API GET PAPER BY SLUG ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch paper.' } }, { status: 500 });
  }
}
