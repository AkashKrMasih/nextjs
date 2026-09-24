"use client";

import {usePathname} from "next/navigation";

export function ConditionalBody({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <body
      className={
        isAdmin
          ? "flex min-h-full flex-col bg-stone-50 text-stone-900"
          : "flex min-h-full w-full max-w-5xl mx-auto flex-col bg-stone-50 text-stone-900"
      }
    >
    {children}
    </body>
  );
}