// app/api/v1/admin/cms/profile-images/reorder/route.ts — Reorder Profile Images
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { reorderProfileImages } from '@/backend/src/services/cms.service';

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse || !auth) {
    return errorResponse || NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const csrfError = validateCsrf(req, auth);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const orderedIds = body.ordered_ids as number[];
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'ordered_ids array required' } }, { status: 400 });
    }

    const updated = await reorderProfileImages(orderedIds);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: error.message } }, { status: 500 });
  }
}
