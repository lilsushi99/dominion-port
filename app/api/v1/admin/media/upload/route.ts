// app/api/v1/admin/media/upload/route.ts — Direct Admin Media Upload API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, verifyCsrfToken } from '@/backend/src/services/auth.service';
import { uploadMedia } from '@/backend/src/services/media.service';

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const cookieToken = req.cookies.get('dominion_session')?.value;
  const token = cookieToken || bearerToken;

  if (!token) return null;
  const sessionResult = await verifySession(token);
  if (!sessionResult) return null;

  return { user: sessionResult.user, token, isBearer: Boolean(bearerToken) };
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  const csrfHeader = req.headers.get('x-csrf-token') || '';
  if (!auth.isBearer && !verifyCsrfToken(auth.token, csrfHeader)) {
    return NextResponse.json({ error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token.' } }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const alt = (formData.get('alt') as string) || '';
    const purpose = (formData.get('purpose') as string) || null;

    if (!file) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided in form-data field "file".' } }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const media = await uploadMedia(buffer, file.name, file.type, alt, purpose);
    return NextResponse.json({ data: media }, { status: 201 });
  } catch (error: any) {
    console.error('[API MEDIA UPLOAD ERROR]', error);
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: error.message || 'Media upload failed.' } },
      { status: 400 }
    );
  }
}
