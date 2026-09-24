import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  const parentOptions = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-xl font-semibold">New Category</h1>
      <CategoryForm parentOptions={parentOptions} submitLabel="Create Category" />
    </div>
  );
}
