// app/api/v1/admin/papers/route.ts — Admin Papers List & Create API
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { listPapers, createPaper } from '@/backend/src/services/papers.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const categorySlug = req.nextUrl.searchParams.get('category') || undefined;
    const status = (req.nextUrl.searchParams.get('status') as 'draft' | 'published') || undefined;

    const papers = await listPapers({
      categorySlug,
      status,
      includeDrafts: true
    });

    return NextResponse.json({ data: papers });
  } catch (err) {
    console.error('[ADMIN GET PAPERS ERROR]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to list papers.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const created = await createPaper(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    console.error('[ADMIN CREATE PAPER ERROR]', err);
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: err.message || 'Failed to create paper.' } }, { status: 400 });
  }
}
