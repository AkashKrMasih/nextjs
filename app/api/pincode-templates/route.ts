import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/admin-auth';
import { parsePincodeList } from '@/lib/delivery-pincodes';

export async function GET() {
  const templates = await prisma.pincodeTemplate.findMany({
    orderBy: { title: 'asc' },
    include: {
      entries: { select: { code: true }, orderBy: { code: 'asc' } },
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json(
    templates.map((template) => ({
      id: template.id,
      title: template.title,
      pincodes: template.entries.map((entry) => entry.code),
      productCount: template._count.products,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }))
  );
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? '').trim();
  const pincodes = parsePincodeList(String(body?.pincodes ?? ''));

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (pincodes.length === 0) {
    return NextResponse.json({ error: 'Add at least one pincode.' }, { status: 400 });
  }

  const template = await prisma.pincodeTemplate.create({
    data: {
      title,
      entries: { create: pincodes.map((code) => ({ code })) },
    },
    include: { entries: { select: { code: true }, orderBy: { code: 'asc' } } },
  });

  return NextResponse.json(
    {
      id: template.id,
      title: template.title,
      pincodes: template.entries.map((entry) => entry.code),
    },
    { status: 201 }
  );
}
