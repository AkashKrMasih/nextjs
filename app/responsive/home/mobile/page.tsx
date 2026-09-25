import { MobileCatalog } from '@/app/components/MobileCatalog';

export default function MobileHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  return <MobileCatalog searchParams={searchParams} />;
}
