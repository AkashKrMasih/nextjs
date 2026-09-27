import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/app/components/PageHeader';
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
      <PageHeader
        title="Price requests"
        description={`${requests.length} ${requests.length === 1 ? 'request' : 'requests'}, newest first`}
        variant="admin"
        overline="Inbox"
      />
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
