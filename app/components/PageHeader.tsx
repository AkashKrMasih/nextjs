import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

type PageHeaderVariant = 'store' | 'admin' | 'auth';

const VARIANT = {
  store: {
    title: 'text-stone-900',
    description: 'text-stone-600',
    overline: 'text-stone-500',
    back: 'text-green-800 hover:bg-green-50 hover:text-stone-900',
    divider: 'border-stone-200/90',
    surface: 'bg-white/90',
  },
  admin: {
    title: 'text-gray-900',
    description: 'text-gray-600',
    overline: 'text-gray-500',
    back: 'text-blue-700 hover:bg-blue-50 hover:text-blue-900',
    divider: 'border-gray-200',
    surface: 'bg-white',
  },
  auth: {
    title: 'text-gray-900',
    description: 'text-gray-600',
    overline: 'text-gray-500',
    back: 'text-blue-700 hover:bg-blue-50 hover:text-blue-900',
    divider: 'border-gray-200',
    surface: 'bg-transparent',
  },
} satisfies Record<PageHeaderVariant, Record<string, string>>;

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Small label above the title (Material overline). */
  overline?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  variant?: PageHeaderVariant;
  /** Inside auth cards — no divider band or shadow. */
  embedded?: boolean;
  className?: string;
};

export function PageHeader({
  title,
  description,
  overline,
  backHref,
  backLabel = 'Back',
  actions,
  variant = 'store',
  embedded = false,
  className,
}: PageHeaderProps) {
  const styles = VARIANT[variant];

  return (
    <header
      className={cn(
        embedded ? 'mb-6' : 'mb-8 rounded-sm border-b pb-6',
        !embedded && styles.divider,
        className
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          className={cn(
            'mb-4 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm font-medium transition-colors',
            styles.back
          )}
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      ) : null}

      {overline ? (
        <p
          className={cn(
            'mb-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em]',
            styles.overline
          )}
        >
          {overline}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              'font-normal leading-tight tracking-[0.01em]',
              embedded ? 'text-2xl font-medium' : 'text-[1.75rem] sm:text-[2.125rem]',
              styles.title
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={cn('mt-2 max-w-3xl text-sm font-normal leading-relaxed', styles.description)}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
