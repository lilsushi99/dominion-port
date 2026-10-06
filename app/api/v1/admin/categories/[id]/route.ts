// app/api/v1/admin/categories/[id]/route.ts — Admin Single Category Ops
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { getCategoryById, updateCategory, deleteCategorySafely } from '@/backend/src/services/categories.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const category = await getCategoryById(parseInt(id, 10));

  if (!category) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } }, { status: 404 });
  }

  return NextResponse.json({ data: category });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  try {
    const body = await req.json();
    const { slug, name, content_type, sort_order, is_active } = body;

    if (!slug?.trim() || !name?.trim()) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Slug and name are required.' } }, { status: 400 });
    }

    const updated = await updateCategory(
      categoryId,
      slug,
      name,
      'project',
      sort_order ?? 0,
      is_active ?? true
    );

    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update category.' } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  try {
    const result = await deleteCategorySafely(categoryId);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'CATEGORY_IN_USE', message: result.error || 'Cannot delete category while items are assigned to it.' } },
        { status: 409 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete category.' } }, { status: 500 });
  }
}
