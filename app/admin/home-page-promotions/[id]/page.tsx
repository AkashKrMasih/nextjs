import { notFound } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { prisma } from '@/lib/prisma';
import { HomePagePromotionForm } from '../home-page-promotion-form';

export default async function EditHomePagePromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promotion, products] = await Promise.all([
    prisma.homePagePromotion.findUnique({ where: { id } }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);
  if (!promotion) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <PageHeader
        title="Edit home promotion"
        description="Update carousel image, link, and sort order."
        backHref="/admin/home-page-promotions"
        backLabel="Back to home promotions"
        variant="admin"
        className="mb-6"
      />
      <HomePagePromotionForm
        promotionId={promotion.id}
        products={products}
        initial={{
          productId: promotion.productId ? String(promotion.productId) : '',
          sortOrder: String(promotion.sortOrder),
          imageUrl: promotion.imageUrl,
        }}
      />
    </main>
  );
}
