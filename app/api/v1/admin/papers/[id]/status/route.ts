// app/api/v1/admin/papers/[id]/status/route.ts — Admin Toggle Paper Status API
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { updatePaperStatus } from '@/backend/src/services/papers.service';

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (status !== 'draft' && status !== 'published') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Status must be draft or published.' } }, { status: 400 });
    }

    const updated = await updatePaperStatus(parseInt(id, 10), status);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update paper status.' } }, { status: 500 });
  }
}
