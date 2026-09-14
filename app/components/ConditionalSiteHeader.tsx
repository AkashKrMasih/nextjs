'use client';

import { usePathname } from 'next/navigation';

export function ConditionalSiteHeader({
  siteHeader,
}: {
  siteHeader: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <>{siteHeader}</>;
}
