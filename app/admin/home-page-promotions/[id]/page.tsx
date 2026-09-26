import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
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
      <Link
        href="/admin/home-page-promotions"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to home promotions
      </Link>
      <h1 className="mt-4 mb-6 text-2xl tracking-tight text-stone-900">Edit home promotion</h1>
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
