// app/api/v1/admin/cms/footer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getFooterSettings, updateFooterSettings } from '@/backend/src/services/cms.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const data = await getFooterSettings();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch footer settings.' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { year_mode, fixed_year, copyright_text, designed_by_text, designer_name, designer_url } = body;

    const updated = await updateFooterSettings(
      year_mode || 'fixed',
      fixed_year ?? 2026,
      copyright_text || '',
      designed_by_text || 'Designed by',
      designer_name || 'Castiel',
      designer_url || 'https://dflamez.com.ng'
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to update footer settings.' } }, { status: 500 });
  }
}
