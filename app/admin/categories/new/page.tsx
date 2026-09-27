import { PageHeader } from "@/app/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  const parentOptions = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg p-6">
      <PageHeader
        title="New category"
        description="Create a top-level category or subcategory."
        backHref="/admin/categories"
        backLabel="Back to categories"
        variant="admin"
        className="mb-6"
      />
      <CategoryForm parentOptions={parentOptions} submitLabel="Create Category" />
    </div>
  );
}
