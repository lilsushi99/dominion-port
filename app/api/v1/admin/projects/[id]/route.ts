// app/api/v1/admin/projects/[id]/route.ts — Admin Single Project Ops
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getProjectById, updateProject, deleteProject } from '@/backend/src/services/projects.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const project = await getProjectById(parseInt(id, 10));

  if (!project) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
  }

  return NextResponse.json({ data: project });
}

export async function PUT(
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
    const updated = await updateProject(projectId, body);

    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error('[ADMIN UPDATE PROJECT ERROR]', err);
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: err.message || 'Failed to update project.' } }, { status: 400 });
  }
}

export async function DELETE(
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
    const success = await deleteProject(projectId);
    if (!success) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete project.' } }, { status: 500 });
  }
}
