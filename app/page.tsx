import { getHomeLayout } from '@/app/home/home-layout';
import { HomeCatalog } from '@/app/components/HomeCatalog';
import { HomeLayoutPrompt } from '@/app/components/HomeLayoutPrompt';
import MobileHomePage from '@/app/responsive/home/mobile/page';
import TabletHomePage from '@/app/responsive/home/tablet/page';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const layout = await getHomeLayout();

  return (
    <>
      <HomeLayoutPrompt saved={layout} />
      {layout === 'mobile' ? (
        <MobileHomePage searchParams={searchParams} />
      ) : layout === 'tablet' ? (
        <TabletHomePage searchParams={searchParams} />
      ) : (
        <HomeCatalog searchParams={searchParams} />
      )}
    </>
  );
}
