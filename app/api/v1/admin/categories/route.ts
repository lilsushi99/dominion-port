// app/api/v1/admin/categories/route.ts — Admin Categories List & Create
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { listCategories, createCategory } from '@/backend/src/services/categories.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    // Papers are a top-level work type; only project categories exist.
    const contentType = 'project' as const;

    const data = await listCategories({ contentType, includeInactive: true });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to list categories.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { slug, name, content_type, sort_order, is_active } = body;

    if (!slug?.trim() || !name?.trim()) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Slug and name are required.' } }, { status: 400 });
    }

    const created = await createCategory(slug, name, 'project', sort_order, is_active ?? true);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to create category.' } }, { status: 500 });
  }
}
