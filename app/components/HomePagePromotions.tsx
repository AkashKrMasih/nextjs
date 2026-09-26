import { prisma } from '@/lib/prisma';
import { promotionHref } from '@/lib/home-page-promotions';
import { HomePagePromotionCarousel } from '@/app/components/HomePagePromotionCarousel';

export async function HomePagePromotions() {
  const promotions = await prisma.homePagePromotion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { product: { select: { friendlyId: true } } },
  });

  const slides = promotions.map((promotion) => ({
    id: promotion.id,
    imageUrl: promotion.imageUrl,
    href: promotionHref(promotion),
  }));

  if (slides.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-5 md:max-w-7xl md:px-6 md:pt-8">
      <HomePagePromotionCarousel slides={slides} />
    </div>
  );
}
