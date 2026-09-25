'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {ArrowLeft, Package, Users, Settings, ChevronDown, CreditCard, Coins, FolderTree, Warehouse, Mail, TicketPercent} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Back', icon: ArrowLeft },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/inventory', label: 'Inventories', icon: Warehouse },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/price-requests', label: 'Price requests', icon: Mail },
  { href: '/admin/discounts', label: 'Discounts', icon: TicketPercent },
];

const SETTINGS_ITEMS = [
  { href: '/admin/settings/stripe', label: 'Stripe', icon: CreditCard },
  { href: '/admin/settings/currency', label: 'Currency', icon: Coins },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const settingsActive = SETTINGS_ITEMS.some((item) => pathname === item.href);
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  useEffect(() => {
    if (settingsActive) setSettingsOpen(true);
  }, [settingsActive]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="px-6 py-6">
          <span className="text-lg font-medium tracking-tight text-gray-900">Admin</span>
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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
                  ? 'bg-blue-500 text-blue-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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