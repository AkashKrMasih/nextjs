'use client';

import { usePathname } from 'next/navigation';

export function ConditionalSiteFooter({
  siteFooter,
}: {
  siteFooter: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <>{siteFooter}</>;
}
