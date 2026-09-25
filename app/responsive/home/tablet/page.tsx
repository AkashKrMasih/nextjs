import { TabletCatalog } from '@/app/components/TabletCatalog';

export default function TabletHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  return <TabletCatalog searchParams={searchParams} />;
}
