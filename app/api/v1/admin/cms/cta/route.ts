// app/api/v1/admin/cms/cta/route.ts — Admin CTA Links List, Create & Batch Save
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { listCtaLinks, createCtaLink, batchSaveCtaLinks } from '@/backend/src/services/cms.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const data = await listCtaLinks(true);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to list CTA links.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { label, url, sort_order, is_active, presentation_mode, platform } = body;

    if (!label?.trim() || !url?.trim()) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Label and URL are required.' } }, { status: 400 });
    }

    const created = await createCtaLink(
      label,
      url,
      sort_order,
      is_active ?? true,
      presentation_mode || 'text',
      platform || null
    );
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to create CTA link.' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { links } = body;

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Links array is required.' } }, { status: 400 });
    }

    const updated = await batchSaveCtaLinks(links);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to batch save CTA links.' } }, { status: 500 });
  }
}
