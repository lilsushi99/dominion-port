// app/api/v1/sitemap/route.ts
import { NextResponse } from 'next/server';
import { SEED_PROJECTS, SEED_ARTICLES } from '@/lib/data-seed';

export async function GET() {
  const items = [
    { path: '/', updated_at: new Date().toISOString() },
    ...SEED_PROJECTS.map(p => ({ path: `/work/${p.slug}`, updated_at: '2026-02-28T12:00:00Z' })),
    ...SEED_ARTICLES.map(a => ({ path: `/papers/${a.slug}`, updated_at: '2026-02-28T12:00:00Z' }))
  ];
  return NextResponse.json({ items });
}
