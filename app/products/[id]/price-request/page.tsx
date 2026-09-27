import { notFound } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PriceRequestForm } from './price-request-form';

export default async function PriceRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendlyId } = await params;

  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { friendlyId },
      select: { id: true, friendlyId: true, name: true, priceOnRequest: true },
    }),
    getSession(),
  ]);

  if (!product || !product.priceOnRequest) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <PageHeader
        title="Price request"
        description={`Request a quote for ${product.name}.`}
        backHref={`/products/${product.friendlyId}`}
        backLabel={product.name}
        variant="store"
        className="mb-6"
      />
      <PriceRequestForm
        productId={product.id}
        productTitle={product.name}
        email={session?.email ?? ''}
      />
    </main>
  );
}
