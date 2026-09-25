import { getHomeLayout } from '@/app/actions/home-layout';
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

  if (layout === 'mobile') {
    return <MobileHomePage searchParams={searchParams} />;
  }

  if (layout === 'tablet') {
    return <TabletHomePage searchParams={searchParams} />;
  }

  return (
    <>
      {layout == null ? <HomeLayoutPrompt /> : null}
      <HomeCatalog searchParams={searchParams} />
    </>
  );
}
