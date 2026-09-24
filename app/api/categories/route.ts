import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCategoryFromForm } from '@/lib/categories';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const category = await createCategoryFromForm(formData);
  if ('error' in category) {
    return NextResponse.json({ error: category.error }, { status: 400 });
  }
  return NextResponse.json(category, { status: 201 });
}
