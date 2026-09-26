import { getSavedHomeLayout } from '@/app/home/home-layout';
import { HomeCatalog } from '@/app/components/HomeCatalog';
import { HomeLayoutPrompt } from '@/app/components/HomeLayoutPrompt';
import MobileHomePage from '@/app/responsive/home/mobile/page';
import TabletHomePage from '@/app/responsive/home/tablet/page';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const saved_layout = await getSavedHomeLayout();

  return (
    <>
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
