"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CategoryFormState = {
  error?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseParentId(raw: FormDataEntryValue | null): number | null {
  if (!raw || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentId = parseParentId(formData.get("parentId"));

  if (!name) {
    return { error: "Name is required." };
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    return { error: "Could not derive a valid slug from that name." };
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return { error: `Slug "${slug}" is already in use.` };
  }

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      return { error: "Selected parent category does not exist." };
    }
  }

  await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
      parentId,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: number,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentId = parseParentId(formData.get("parentId"));

  if (!name) {
    return { error: "Name is required." };
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    return { error: "Could not derive a valid slug from that name." };
  }

  if (parentId === id) {
    return { error: "A category cannot be its own parent." };
  }

  const slugOwner = await prisma.category.findUnique({ where: { slug } });
  if (slugOwner && slugOwner.id !== id) {
    return { error: `Slug "${slug}" is already in use.` };
  }

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      return { error: "Selected parent category does not exist." };
    }
    // Prevent assigning one of this category's own descendants as its parent
    // (would create a cycle in the self-relation).
    let cursor: number | null = parent.id;
    while (cursor) {
      if (cursor === id) {
        return { error: "Cannot select a descendant category as the parent." };
      }
      const node: { parentId: number | null } | null = await prisma.category.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = node?.parentId ?? null;
    }
  }

  await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      parentId,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: number) {
  // Children have onDelete: SetNull on parentId, and products have
  // onDelete: SetNull on categoryId, so this is safe — it won't cascade-delete
  // child categories or products, it just detaches them.
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
