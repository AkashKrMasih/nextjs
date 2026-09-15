'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {ArrowLeft, Package, Users} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Back', icon: ArrowLeft },
  { href: '/admin', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card">
        <div className="px-6 py-6">
          <span className="text-lg font-medium tracking-tight text-foreground">Admin</span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}