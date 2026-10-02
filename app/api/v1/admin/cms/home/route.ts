// app/api/v1/admin/cms/home/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getHomeContent, updateHomeContent } from '@/backend/src/services/cms.service';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const data = await getHomeContent();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch home content.' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { body_json, body_html, sign_off } = body;

    if (!body_html || !sign_off) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Body HTML and sign-off are required.' } }, { status: 400 });
    }

    const updated = await updateHomeContent(body_json || {}, body_html, sign_off);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to update home content.' } }, { status: 500 });
  }
}
