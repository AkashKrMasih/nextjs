import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { SUPPORT_TICKET_CATEGORIES } from '@/lib/support-tickets';

const CATEGORY_VALUES = new Set(
  SUPPORT_TICKET_CATEGORIES.map((entry) => entry.value)
);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to open a support ticket.' }, { status: 401 });
  }

  const formData = await request.formData();
  const orderId = String(formData.get('orderId') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();

  if (!orderId) {
    return NextResponse.json({ error: 'Select an order.' }, { status: 400 });
  }
  if (!subject || subject.length > 200) {
    return NextResponse.json({ error: 'Subject is required (max 200 characters).' }, { status: 400 });
  }
  if (!message || message.length > 5000) {
    return NextResponse.json({ error: 'Message is required (max 5000 characters).' }, { status: 400 });
  }

  // if (!CATEGORY_VALUES.has(category as 'DELIVERY' | 'ITEM_ISSUE' | 'REFUND' | 'ORDER_STATUS' | 'OTHER')) {

  if (!CATEGORY_VALUES.has(category as (typeof SUPPORT_TICKET_CATEGORIES)[number]['value'])) {
    return NextResponse.json({ error: 'Select a valid category.' }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.userId },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      orderId,
      userId: session.userId,
      subject,
      message,
      category: category as (typeof SUPPORT_TICKET_CATEGORIES)[number]['value'],
    },
    select: { id: true, subject: true, status: true, createdAt: true },
  });

  return NextResponse.json(ticket, { status: 201 });
}
