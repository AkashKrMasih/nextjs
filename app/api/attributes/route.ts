// Drop this in as app/api/attributes/route.ts
//
// Returns every distinct attribute title used across the catalog, each with
// its distinct set of known values, e.g.
//   [{ title: "Material", values: ["Cotton", "Wool"] }, ...]
// Powers the autocomplete in ProductForm — it's just suggestions, so this
// stays a light read; nothing here creates or reserves anything.

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Each row is one title/value pair — a product that needs multiple values
  // for the same concept just has multiple rows sharing that title. See the
  // ProductAttribute model comment in schema.prisma.
  const attributes = await prisma.productAttribute.findMany({
    select: {
      title: true,
      value: true,
    },
  });

  // Merge case-insensitively by title (first-seen casing wins) so "material"
  // and "Material" from different products collapse into one suggestion.
  const byTitle = new Map<string, { title: string; values: Set<string> }>();

  for (const attr of attributes) {
    const title = attr.title.trim();
    if (!title) continue;

    const toLowerCaseTitle = title.toLowerCase();
    if (!byTitle.has(toLowerCaseTitle)) {
      byTitle.set(toLowerCaseTitle, { title, values: new Set() });
    }
    const entry = byTitle.get(toLowerCaseTitle)!;

    const trimmed = attr.value?.trim();
    if (trimmed) entry.values.add(trimmed);
  }

  const result = Array.from(byTitle.values())
  .map(({ title, values }) => ({ title, values: Array.from(values).sort() }))
  .sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json(result);
}