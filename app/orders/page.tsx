import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { formatPrice } from '@/lib/money';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
};

function statusClass(status: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-800';
  if (status === 'FAILED') return 'bg-red-100 text-red-800';
  return 'bg-stone-100 text-stone-700';
}

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          variant: { select: { product: { select: { friendlyId: true } } } },
        },
      },
      address: true,
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl tracking-tight text-stone-900">My Orders</h1>
      <p className="mt-1 text-sm text-stone-500">Newest first</p>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">You have not placed any orders.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const currency = order.currency.toUpperCase();
            const address = order.address;
            const addressLine = address
              ? [address.name, address.address1, address.city, address.postalCode, address.country]
                  .filter(Boolean)
                  .join(', ')
              : null;

            return (
              <li key={order.id} className="rounded-lg border border-stone-300 bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-stone-900">
                    {formatPrice(order.amountTotal / 100, currency)}
                  </p>
                  <time className="text-xs text-stone-500">
                    {order.createdAt.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <span
                  className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${statusClass(order.status)}`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
                <ul className="mt-3 space-y-1">
                  {order.items.map((item) => {
                    const friendlyId = item.variant.product.friendlyId;
                    return (
                      <li key={item.id} className="text-sm text-stone-700">
                        <Link href={`/products/${friendlyId}`} className="hover:text-green-800">
                          {item.name}
                        </Link>
                        {' '}
                        × {item.quantity}
                        <span className="text-stone-500">
                          {' '}
                          · {formatPrice(item.unitPrice / 100, currency)} each
                          {item.discountCode ? ` · code ${item.discountCode}` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {addressLine ? (
                  <p className="mt-3 text-sm text-stone-500">{addressLine}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
