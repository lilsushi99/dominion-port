// app/api/v1/admin/papers/[id]/route.ts — Admin Get, Update, Delete Paper API
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getPaperById, updatePaper, deletePaper } from '@/backend/src/services/papers.service';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const paper = await getPaperById(parseInt(id, 10));

    if (!paper) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Paper not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: paper });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch paper.' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updatePaper(parseInt(id, 10), body);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error('[ADMIN UPDATE PAPER ERROR]', err);
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: err.message || 'Failed to update paper.' } }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const success = await deletePaper(parseInt(id, 10));

    if (!success) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Paper not found.' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Paper deleted successfully.' });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete paper.' } }, { status: 500 });
  }
}
