import { prisma } from '@/lib/prisma';
import { PriceRequestList } from './price-request-list';

export default async function PriceRequestsPage() {
  const requests = await prisma.priceRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { friendlyId: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-gray-900">Price requests</h1>
      <p className="mt-1 text-sm text-gray-500">
        {requests.length} {requests.length === 1 ? 'request' : 'requests'}, newest first
      </p>
      <PriceRequestList
        requests={requests.map((request) => ({
          id: request.id,
          email: request.email,
          productTitle: request.productTitle,
          message: request.message,
          productId: request.productId,
          friendlyId: request.product.friendlyId,
          userName: request.user?.name || request.user?.email || null,
          createdAt: request.createdAt.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        }))}
      />
    </main>
  );
}
