import { prisma } from '@/lib/prisma';

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parentIdFrom(value: FormDataEntryValue | null) {
  if (!value || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseCategoryForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const slugInput = String(formData.get('slug') ?? '').trim();
  const parentId = parentIdFrom(formData.get('parentId'));

  if (!name) return { error: 'Name is required.' };

  const slug = slugify(slugInput || name);
  if (!slug) return { error: 'Could not derive a valid slug from that name.' };

  return {
    name,
    slug,
    description: description || null,
    parentId,
  };
}

async function parentExists(parentId: number | null) {
  if (!parentId) return true;
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  return Boolean(parent);
}

async function createsCycle(categoryId: number, parentId: number) {
  let cursor: number | null = parentId;
  while (cursor) {
    if (cursor === categoryId) return true;
    const node: { parentId: number | null } | null = await prisma.category.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = node?.parentId ?? null;
  }
  return false;
}

export async function createCategoryFromForm(formData: FormData) {
  const parsed = parseCategoryForm(formData);
  if ('error' in parsed) return parsed;

  const existing = await prisma.category.findUnique({ where: { slug: parsed.slug } });
  if (existing) return { error: `Slug "${parsed.slug}" is already in use.` };

  if (!(await parentExists(parsed.parentId))) {
    return { error: 'Selected parent category does not exist.' };
  }

  return prisma.category.create({ data: parsed });
}

export async function updateCategoryFromForm(id: number, formData: FormData) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { error: 'Not found', status: 404 as const };

  const parsed = parseCategoryForm(formData);
  if ('error' in parsed) return parsed;

  if (parsed.parentId === id) {
    return { error: 'A category cannot be its own parent.' };
  }

  const slugOwner = await prisma.category.findUnique({ where: { slug: parsed.slug } });
  if (slugOwner && slugOwner.id !== id) {
    return { error: `Slug "${parsed.slug}" is already in use.` };
  }

  if (parsed.parentId && !(await parentExists(parsed.parentId))) {
    return { error: 'Selected parent category does not exist.' };
  }

  if (parsed.parentId && (await createsCycle(id, parsed.parentId))) {
    return { error: 'Cannot select a descendant category as the parent.' };
  }

  return prisma.category.update({ where: { id }, data: parsed });
}
