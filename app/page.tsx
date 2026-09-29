import { getSavedHomeLayout } from '@/app/home/home-layout';
import type { HomeCatalogSearchParams } from '@/app/home/load-home-catalog';
import { HomeCatalog } from '@/app/components/HomeCatalog';
import { HomeLayoutPrompt } from '@/app/components/HomeLayoutPrompt';
import { HomePagePromotions } from '@/app/components/HomePagePromotions';
import MobileHomePage from '@/app/responsive/home/mobile/page';
import TabletHomePage from '@/app/responsive/home/tablet/page';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeCatalogSearchParams>;
}) {
  const saved_layout = await getSavedHomeLayout();

  return (
    <>
      <HomePagePromotions />
      <HomeLayoutPrompt saved={saved_layout} />
      {saved_layout === 'mobile' ? (
        <MobileHomePage searchParams={searchParams} />
      ) : saved_layout === 'tablet' ? (
        <TabletHomePage searchParams={searchParams} />
      ) : (
        <HomeCatalog searchParams={searchParams} />
      )}
    </>
  );
}
