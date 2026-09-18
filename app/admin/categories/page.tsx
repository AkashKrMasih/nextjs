import Link from "next/link";
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
        <h1 className="text-xl font-semibold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4">Parent</th>
            <th className="py-2 pr-4">Products</th>
            <th className="py-2 pr-4"></th>
          </tr>
          </thead>
          <tbody>
          {categories.map((category) => {
            const hasDependents =
                    category._count.products > 0 || category._count.children > 0;
            return (
              <tr key={category.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{category.name}</td>
                <td className="py-2 pr-4 text-gray-500">{category.slug}</td>
                <td className="py-2 pr-4 text-gray-500">
                  {category.parent?.name ?? "—"}
                </td>
                <td className="py-2 pr-4 text-gray-500">
                  {category._count.products}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
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
      )}
    </div>
  );
}