"use client";

import {usePathname} from "next/navigation";

export function ConditionalBody({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <body
      className={
        isAdmin
          ? "flex min-h-full flex-col bg-[#FAF8F3] text-[#1E1B16]"
          : "flex min-h-full w-[1024px] mx-auto flex-col bg-[#FAF8F3] text-[#1E1B16]"
      }
    >
    {children}
    </body>
  );
}