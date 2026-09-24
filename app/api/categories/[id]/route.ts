import { NextResponse } from 'next/server';
import { updateCategoryFromForm } from '@/lib/categories';

function categoryId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = categoryId(id);
  if (!numericId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const formData = await request.formData();
  const category = await updateCategoryFromForm(numericId, formData);
  if ('error' in category) {
    return NextResponse.json(
      { error: category.error },
      { status: 'status' in category ? category.status : 400 }
    );
  }
  return NextResponse.json(category);
}
