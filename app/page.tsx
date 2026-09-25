import { redirect } from 'next/navigation';
import { getHomeLayout } from '@/app/actions/home-layout';
import { HomeCatalog } from '@/app/components/HomeCatalog';
import { HomeLayoutPrompt } from '@/app/components/HomeLayoutPrompt';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const layout = await getHomeLayout();
  if (layout === 'mobile' || layout === 'tablet') {
    const params = await searchParams;
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.min) query.set('min', params.min);
    if (params.max) query.set('max', params.max);
    const suffix = query.size ? `?${query.toString()}` : '';
    redirect(`/responsive/home/${layout}${suffix}`);
  }

  return (
    <>
      {layout == null ? <HomeLayoutPrompt /> : null}
      <HomeCatalog searchParams={searchParams} />
    </>
  );
}
