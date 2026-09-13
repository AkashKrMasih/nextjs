import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/app/components/ProductDetail';
import "../../../src/styles/index.css";

export default async function ProductPage({
                                            params,
                                          }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const [product, related] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.product.findMany({
      where: { id: { not: productId } },
      orderBy: { id: 'desc' },
      take: 4,
    }),
  ]);

  if (!product) return notFound();

  return <ProductDetail product={product} related={related} />;
}