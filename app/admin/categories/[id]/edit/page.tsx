import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../../category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { id: { not: id } }, // a category can't be its own parent
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <PageHeader
        title="Edit category"
        description={category.name}
        backHref="/admin/categories"
        backLabel="Back to categories"
        variant="admin"
        className="mb-6"
      />
      <CategoryForm
        categoryId={category.id}
        parentOptions={parentOptions}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          parentId: category.parentId,
        }}
        submitLabel="Save Changes"
      />
    </div>
  );
}
