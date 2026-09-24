"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: number) {
  // Children have onDelete: SetNull on parentId, and products have
  // onDelete: SetNull on categoryId, so this is safe — it won't cascade-delete
  // child categories or products, it just detaches them.
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
