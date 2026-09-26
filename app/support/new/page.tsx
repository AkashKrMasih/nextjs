import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { formatPrice } from '@/lib/money';
import { shortOrderId } from '@/lib/support-tickets';
import { SupportTicketForm } from './support-ticket-form';

export default async function NewSupportTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { orderId: preselectedOrderId } = await searchParams;

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      amountTotal: true,
      currency: true,
      status: true,
    },
  });

  const orderOptions = orders.map((order) => {
    const currency = order.currency.toUpperCase();
    const date = order.createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return {
      id: order.id,
      label: `${formatPrice(order.amountTotal / 100, currency)} · ${order.status} · ${date} · #${shortOrderId(order.id)}`,
    };
  });

  const initialOrderId =
    preselectedOrderId && orders.some((order) => order.id === preselectedOrderId)
      ? preselectedOrderId
      : undefined;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link href="/support" className="text-sm text-green-800 hover:text-stone-900">
        ← Back to support
      </Link>
      <h1 className="mt-4 text-2xl tracking-tight text-stone-900">New support ticket</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tell us about an issue with one of your orders. We will follow up by email.
      </p>
      <SupportTicketForm orders={orderOptions} initialOrderId={initialOrderId} />
    </main>
  );
}
