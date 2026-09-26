import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/app/components/ProductDetail';
import { isProductWishlisted } from '@/app/actions/wishlist';
import { getSession } from '@/lib/session';

export default async function ProductPage({
                                            params,
                                          }: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendlyId } = await params;

  const product = await prisma.product.findUnique({
    where: { friendlyId },
    include: {
      images: true,
      attributes: { orderBy: { title: 'asc' } },
    },
  });
  if (!product) return notFound();

  const [related, initialWishlisted, session] = await Promise.all([
    prisma.product.findMany({
      where: { id: { not: product.id } },
      orderBy: { id: 'desc' },
      take: 4,
      include: { images: true },
    }),
    isProductWishlisted(product.id),
    getSession(),
  ]);

  // Prisma's Decimal type isn't a plain object, so it can't cross the
  // server -> client boundary as-is. Serialize price to a string here;
  // formatPrice() already accepts number | string.
  const serializedProduct = {
    ...product,
    price: product.price.toString(),
    attributes: product.attributes.map((attribute) => ({
      id: attribute.id,
      title: attribute.title,
      value: attribute.value,
    })),
  };
  const serializedRelated = related.map((item) => ({
    ...item,
    price: item.price.toString(),
  }));

  return (
    <ProductDetail
      product={serializedProduct}
      related={serializedRelated}
      initialWishlisted={initialWishlisted}
      isLoggedIn={Boolean(session)}
    />
  );
}