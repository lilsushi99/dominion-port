// app/api/v1/admin/projects/reorder/route.ts — Admin Reorder Projects
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { reorderProjects } from '@/backend/src/services/projects.service';

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { ordered_ids } = body;

    if (!Array.isArray(ordered_ids)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'ordered_ids array is required.' } }, { status: 400 });
    }

    const updated = await reorderProjects(ordered_ids);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to reorder projects.' } }, { status: 500 });
  }
}
