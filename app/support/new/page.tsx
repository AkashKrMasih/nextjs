import { redirect } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
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
      <PageHeader
        title="New support ticket"
        description="Tell us about an issue with one of your orders. We will follow up by email."
        backHref="/support"
        backLabel="Back to support"
        variant="store"
      />
      <SupportTicketForm orders={orderOptions} initialOrderId={initialOrderId} />
    </main>
  );
}
