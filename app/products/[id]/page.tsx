import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/app/components/ProductDetail';

export default async function ProductPage({
                                            params,
                                          }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const [product, related] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    }),
    prisma.product.findMany({
      where: { id: { not: productId } },
      orderBy: { id: 'desc' },
      take: 4,
      include: { images: true },
    }),
  ]);

  if (!product) return notFound();

  return <ProductDetail product={product} related={related} />;
}