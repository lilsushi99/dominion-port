// app/api/v1/admin/media/route.ts — Next.js Admin Media List & Upload API
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, verifyCsrfToken } from '@/backend/src/services/auth.service';
import { listMedia, uploadMedia } from '@/backend/src/services/media.service';

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

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  const kind = (req.nextUrl.searchParams.get('kind') as 'image' | 'video') || undefined;
  const search = req.nextUrl.searchParams.get('search') || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  try {
    const result = await listMedia({ kind, search, limit, offset });
    return NextResponse.json({ data: result.items, total: result.total });
  } catch (error) {
    console.error('[API MEDIA LIST ERROR]', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to list media.' } }, { status: 500 });
  }
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

    if (!file) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided in form-data field "file".' } }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const media = await uploadMedia(buffer, file.name, file.type, alt);
    return NextResponse.json({ data: media }, { status: 201 });
  } catch (error: any) {
    console.error('[API MEDIA UPLOAD ERROR]', error);
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: error.message || 'Media upload failed.' } },
      { status: 400 }
    );
  }
}
