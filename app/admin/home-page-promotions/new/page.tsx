import { PageHeader } from '@/app/components/PageHeader';
import { prisma } from '@/lib/prisma';
import { HomePagePromotionForm } from '../home-page-promotion-form';

export default async function NewHomePagePromotionPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <PageHeader
        title="New home promotion"
        description="Add a slide to the storefront carousel."
        backHref="/admin/home-page-promotions"
        backLabel="Back to home promotions"
        variant="admin"
        className="mb-6"
      />
      <HomePagePromotionForm products={products} />
    </main>
  );
}
