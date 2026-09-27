import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/admin-auth';
import { parsePincodeList } from '@/lib/delivery-pincodes';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? '').trim();
  const pincodes = parsePincodeList(String(body?.pincodes ?? ''));

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (pincodes.length === 0) {
    return NextResponse.json({ error: 'Add at least one pincode.' }, { status: 400 });
  }

  const existing = await prisma.pincodeTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.pincodeTemplateEntry.deleteMany({ where: { templateId: id } });
    return tx.pincodeTemplate.update({
      where: { id },
      data: {
        title,
        entries: { create: pincodes.map((code) => ({ code })) },
      },
      include: { entries: { select: { code: true }, orderBy: { code: 'asc' } } },
    });
  });

  return NextResponse.json({
    id: template.id,
    title: template.title,
    pincodes: template.entries.map((entry) => entry.code),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.pincodeTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.pincodeTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
