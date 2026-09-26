"use client";

import {usePathname} from "next/navigation";

export function ConditionalBody({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <body
      className={"flex min-h-full flex-col bg-stone-50 text-stone-900"}
    >
    {children}
    </body>
  );
}