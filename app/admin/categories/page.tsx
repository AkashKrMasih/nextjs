import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteCategoryButton } from "./delete-button";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-sm text-gray-500">No categories yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Slug</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Parent</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Products</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-500">Actions</th>
              </tr>
              </thead>
              <tbody>
              {categories.map((category) => {
                const hasDependents =
                        category._count.products > 0 || category._count.children > 0;
                return (
                  <tr
                    key={category.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{category.slug}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {category.parent?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {category._count.products}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          aria-label="Edit category"
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <DeleteCategoryButton
                          id={category.id}
                          name={category.name}
                          disabled={hasDependents}
                          disabledReason={
                            hasDependents
                              ? "Reassign or remove its products/subcategories first"
                              : undefined
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}