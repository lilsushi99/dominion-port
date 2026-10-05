// app/api/v1/admin/cms/cta/[id]/route.ts — Admin Individual CTA Link Update & Delete
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { updateCtaLink, deleteCtaLink } from '@/backend/src/services/cms.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  const { id } = await params;
  const linkId = parseInt(id, 10);

  try {
    const body = await req.json();
    const { label, url, sort_order, is_active, presentation_mode, platform } = body;

    if (!label?.trim() || !url?.trim()) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Label and URL are required.' } }, { status: 400 });
    }

    const updated = await updateCtaLink(
      linkId,
      label,
      url,
      sort_order ?? 0,
      is_active ?? true,
      presentation_mode || 'text',
      platform || null
    );
    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'CTA link not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to update CTA link.' } }, { status: 500 });
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
  const linkId = parseInt(id, 10);

  try {
    const success = await deleteCtaLink(linkId);
    if (!success) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'CTA link not found.' } }, { status: 404 });
    }
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete CTA link.' } }, { status: 500 });
  }
}
