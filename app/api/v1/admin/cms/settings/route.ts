// app/api/v1/admin/cms/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getSiteSettings, updateSiteSettings } from '@/backend/src/services/cms.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const data = await getSiteSettings();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch site settings.' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { projects_heading, background_mode } = body;

    if (!projects_heading?.trim()) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Projects heading is required.' } }, { status: 400 });
    }

    if (background_mode !== undefined && background_mode !== 'black' && background_mode !== 'off_black') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: "background_mode must be 'black' or 'off_black'." } }, { status: 400 });
    }

    const current = await getSiteSettings();
    const updated = await updateSiteSettings(projects_heading, background_mode ?? current.background_mode);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to update site settings.' } }, { status: 500 });
  }
}
