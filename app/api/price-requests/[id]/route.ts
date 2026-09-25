import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.priceRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isOwner = existing.userId === session.userId;
  if (session.role !== 'ADMIN' && !isOwner) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await prisma.priceRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
