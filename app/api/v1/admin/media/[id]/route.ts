// app/api/v1/admin/media/[id]/route.ts — Admin Single Media Ops
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, verifyCsrfToken } from '@/backend/src/services/auth.service';
import { getMediaById, updateMediaAlt, deleteMediaSafely } from '@/backend/src/services/media.service';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  const { id } = await params;
  const mediaId = parseInt(id, 10);
  const media = await getMediaById(mediaId);

  if (!media) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Media item not found.' } }, { status: 404 });
  }

  return NextResponse.json({ data: media });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  const csrfHeader = req.headers.get('x-csrf-token') || '';
  if (!auth.isBearer && !verifyCsrfToken(auth.token, csrfHeader)) {
    return NextResponse.json({ error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token.' } }, { status: 403 });
  }

  const { id } = await params;
  const mediaId = parseInt(id, 10);
  const body = await req.json();

  if (typeof body.alt !== 'string') {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Alt text string is required.' } }, { status: 400 });
  }

  const updated = await updateMediaAlt(mediaId, body.alt);
  if (!updated) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Media item not found.' } }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }

  const csrfHeader = req.headers.get('x-csrf-token') || '';
  if (!auth.isBearer && !verifyCsrfToken(auth.token, csrfHeader)) {
    return NextResponse.json({ error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token.' } }, { status: 403 });
  }

  const { id } = await params;
  const mediaId = parseInt(id, 10);
  const result = await deleteMediaSafely(mediaId);

  if (!result.success) {
    if (result.references && result.references.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'MEDIA_IN_USE',
            message: `This media item cannot be deleted because it is in use by: ${result.references.join(', ')}. Remove it from these items first.`,
            references: result.references
          }
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Media item not found or could not be deleted.' } }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true, message: 'Media deleted successfully.' } });
}
