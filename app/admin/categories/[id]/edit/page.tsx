import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../../category-form";
import { updateCategory, type CategoryFormState } from "../../actions";

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

  const boundUpdateCategory = async (
    state: CategoryFormState,
    formData: FormData
  ) => updateCategory(id, state, formData);

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-xl font-semibold">Edit Category</h1>
      <CategoryForm
        action={boundUpdateCategory}
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
