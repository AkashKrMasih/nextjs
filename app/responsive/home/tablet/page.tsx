import { HomeCatalog } from '@/app/components/HomeCatalog';

export default function TabletHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  return (
    <HomeCatalog
      searchParams={searchParams}
      formAction="/responsive/home/tablet"
      showDesktopLink
    />
  );
}
