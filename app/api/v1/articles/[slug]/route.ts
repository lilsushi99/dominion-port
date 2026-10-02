// app/api/v1/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SEED_ARTICLES } from '@/lib/data-seed';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = SEED_ARTICLES.find(a => a.slug === slug);
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
  return NextResponse.json(article);
}
