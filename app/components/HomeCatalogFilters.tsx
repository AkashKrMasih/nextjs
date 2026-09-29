'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeCatalogSort } from '@/app/home/load-home-catalog';

const fieldClass =
  'rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800';

type CategoryOption = { id: number; name: string };

function catalogHref(values: {
  q: string;
  category: string;
  min: string;
  max: string;
  sort: string;
}) {
  const params = new URLSearchParams();
  const trimmedQ = values.q.trim();
  if (trimmedQ) params.set('q', trimmedQ);
  if (values.category) params.set('category', values.category);
  const min = values.min.trim();
  const max = values.max.trim();
  if (min) params.set('min', min);
  if (max) params.set('max', max);
  if (values.sort) params.set('sort', values.sort);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export function HomeCatalogFilters({
  query,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  hasFilters,
  categories,
}: {
  query: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: HomeCatalogSort;
  hasFilters: boolean;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const skipDebouncedNavigation = useRef(true);

  const [q, setQ] = useState(query);
  const [category, setCategory] = useState(categoryId ? String(categoryId) : '');
  const [min, setMin] = useState(minPrice != null ? String(minPrice) : '');
  const [max, setMax] = useState(maxPrice != null ? String(maxPrice) : '');
  const [sortValue, setSortValue] = useState(sort === 'newest' ? '' : sort);

  const filtersRef = useRef({ q, category, min, max, sort: sortValue });
  filtersRef.current = { q, category, min, max, sort: sortValue };

  useEffect(() => {
    setQ(query);
    setCategory(categoryId ? String(categoryId) : '');
    setMin(minPrice != null ? String(minPrice) : '');
    setMax(maxPrice != null ? String(maxPrice) : '');
    setSortValue(sort === 'newest' ? '' : sort);
  }, [query, categoryId, minPrice, maxPrice, sort]);

  const applyFilters = useCallback(
    (values: { q: string; category: string; min: string; max: string; sort: string }) => {
      router.replace(catalogHref(values));
    },
    [router]
  );

  useEffect(() => {
    if (skipDebouncedNavigation.current) {
      skipDebouncedNavigation.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      applyFilters(filtersRef.current);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [q, min, max, applyFilters]);

  return (
    <>
      <div className="col-span-12">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by title or description"
          className={`w-full ${fieldClass}`}
        />
      </div>

      <aside className="col-span-12 md:col-span-4">
        <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            Category
            <select
              name="category"
              value={category}
              onChange={(event) => {
                const next = event.target.value;
                setCategory(next);
                applyFilters({ q, category: next, min, max, sort: sortValue });
              }}
              className={fieldClass}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            Sort by
            <select
              name="sort"
              value={sortValue}
              onChange={(event) => {
                const next = event.target.value;
                setSortValue(next);
                applyFilters({ q, category, min, max, sort: next });
              }}
              className={fieldClass}
            >
              <option value="">Newest</option>
              <option value="price">Price (low to high)</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex w-full flex-col gap-1 text-sm text-stone-600">
              Min price
              <input
                type="number"
                name="min"
                min="0"
                step="0.01"
                value={min}
                onChange={(event) => setMin(event.target.value)}
                className={`w-full ${fieldClass}`}
              />
            </label>
            <label className="flex w-full flex-col gap-1 text-sm text-stone-600">
              Max price
              <input
                type="number"
                name="max"
                min="0"
                step="0.01"
                value={max}
                onChange={(event) => setMax(event.target.value)}
                className={`w-full ${fieldClass}`}
              />
            </label>
          </div>
          {hasFilters ? (
            <Link href="/" className="inline-block text-sm text-stone-500 hover:text-stone-900">
              Clear
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  );
}
