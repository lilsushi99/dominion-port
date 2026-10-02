// app/api/v1/categories/route.ts — Public Active Categories
import { NextRequest, NextResponse } from 'next/server';
import { listCategories } from '@/backend/src/services/categories.service';

export async function GET(req: NextRequest) {
  try {
    const contentType = (req.nextUrl.searchParams.get('type') as 'project' | 'paper') || undefined;

    const categories = await listCategories({
      contentType,
      includeInactive: false
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('[API GET CATEGORIES ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to load categories.' } }, { status: 500 });
  }
}
