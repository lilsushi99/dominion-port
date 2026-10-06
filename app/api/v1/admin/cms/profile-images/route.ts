// app/api/v1/admin/cms/profile-images/route.ts — List & Add Profile Images
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { listProfileImages, addProfileImage } from '@/backend/src/services/cms.service';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse || !auth) {
    return errorResponse || NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const images = await listProfileImages();
    return NextResponse.json({ data: images });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse || !auth) {
    return errorResponse || NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const csrfError = validateCsrf(req, auth);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const mediaId = Number(body.media_id);
    if (!mediaId || isNaN(mediaId)) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Valid media_id is required' } }, { status: 400 });
    }

    const created = await addProfileImage(mediaId);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: error.message } }, { status: 500 });
  }
}
