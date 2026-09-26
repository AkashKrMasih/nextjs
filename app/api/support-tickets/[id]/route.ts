import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { SUPPORT_TICKET_STATUSES } from '@/lib/support-tickets';

const STATUS_VALUES = new Set(SUPPORT_TICKET_STATUSES);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === 'string' ? body.status.trim() : '';

  if (!STATUS_VALUES.has(status as (typeof SUPPORT_TICKET_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status: status as (typeof SUPPORT_TICKET_STATUSES)[number] },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json(ticket);
}
