import Link from 'next/link';
import { notFound } from 'next/navigation';
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
      <Link href={`/products/${product.friendlyId}`} className="text-sm text-stone-500 hover:text-green-800">
        ← {product.name}
      </Link>
      <h1 className="mt-6 mb-6 text-2xl tracking-tight text-stone-900">Price request</h1>
      <PriceRequestForm
        productId={product.id}
        productTitle={product.name}
        email={session?.email ?? ''}
      />
    </main>
  );
}
