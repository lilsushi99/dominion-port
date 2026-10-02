// app/api/v1/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMergedListItems } from '@/lib/data-seed';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || undefined;
  const items = getMergedListItems(category);
  return NextResponse.json(items);
}
