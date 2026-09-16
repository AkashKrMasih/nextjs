'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Package, Users, Settings, ChevronDown, CreditCard, Coins } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Back', icon: ArrowLeft },
  { href: '/admin', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
];

const SETTINGS_ITEMS = [
  { href: '/admin/settings/stripe', label: 'Stripe', icon: CreditCard },
  { href: '/admin/settings/currency', label: 'Currency', icon: Coins },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsActive = SETTINGS_ITEMS.some((item) => pathname === item.href);

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

          <div>
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              className={[
                'flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                settingsActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              <Settings className="size-4" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown
                className={[
                  'size-4 transition-transform',
                  settingsOpen ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>

            {settingsOpen && (
              <div className="mt-1 flex flex-col gap-1 pl-9">
                {SETTINGS_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={[
                        'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors',
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
              </div>
            )}
          </div>
        </nav>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}