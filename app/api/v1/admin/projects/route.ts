// app/api/v1/admin/projects/route.ts — Admin Projects List & Create
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, validateCsrf } from '@/lib/auth/admin-auth-helper';
import { listProjects, createProject } from '@/backend/src/services/projects.service';

export async function GET(req: NextRequest) {
  const { errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const categorySlug = req.nextUrl.searchParams.get('category') || undefined;
    const status = (req.nextUrl.searchParams.get('status') as 'draft' | 'published') || undefined;

    const projects = await listProjects({
      categorySlug,
      status,
      includeDrafts: true
    });

    return NextResponse.json({ data: projects });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to list projects.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await authenticateAdmin(req);
  if (errorResponse) return errorResponse;

  const csrfError = validateCsrf(req, auth!);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const created = await createProject(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    console.error('[ADMIN CREATE PROJECT ERROR]', err);
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: err.message || 'Failed to create project.' } }, { status: 400 });
  }
}
