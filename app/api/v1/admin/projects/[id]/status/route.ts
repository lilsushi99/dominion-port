// app/api/v1/admin/projects/[id]/status/route.ts — Quick Status Toggle
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { updateProjectStatus } from '@/backend/src/services/projects.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  const { id } = await params;
  const projectId = parseInt(id, 10);

  try {
    const body = await req.json();
    const { status } = body;

    if (status !== 'draft' && status !== 'published') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Status must be draft or published.' } }, { status: 400 });
    }

    const updated = await updateProjectStatus(projectId, status);
    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update status.' } }, { status: 500 });
  }
}
