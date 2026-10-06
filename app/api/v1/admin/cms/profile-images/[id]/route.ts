// app/api/v1/admin/cms/profile-images/[id]/route.ts — Delete Profile Image
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { deleteProfileImage } from '@/backend/src/services/cms.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse || !auth) {
    return errorResponse || NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const csrfError = validateCsrf(req, auth);
  if (csrfError) return csrfError;

  const { id } = await params;
  const imageId = Number(id);
  if (!imageId || isNaN(imageId)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid image ID' } }, { status: 400 });
  }

  try {
    const success = await deleteProfileImage(imageId);
    return NextResponse.json({ data: { success } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: error.message } }, { status: 500 });
  }
}
