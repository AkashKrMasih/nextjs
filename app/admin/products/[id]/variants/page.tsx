import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getProduct, getProductVariants } from "./actions";
import { DeleteVariantButton } from "./delete-variant-button";

export default async function ProductVariantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  const product = await getProduct(productId);
  if (!product) notFound();

  const variants = await getProductVariants(productId);

  return (
    <div className="p-6">
      <PageHeader
        title={`Variants — ${product.name}`}
        description={`Base price: $${product.price.toString()}`}
        backHref={`/admin/products/${productId}/edit`}
        backLabel="Back to product"
        variant="admin"
        actions={
          <Link
            href={`/admin/products/${productId}/variants/new`}
            className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            New variant
          </Link>
        }
        className="mb-6"
      />

      {variants.length === 0 ? (
        <p className="text-sm text-gray-500">
          No variants yet. Every product needs at least one — create a default
          variant to make it purchasable.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2 pr-4">SKU</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2 pr-4">Default</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-b">
                <td className="py-2 pr-4 font-mono">{variant.sku}</td>
                <td className="py-2 pr-4">{variant.name ?? "—"}</td>
                <td className="py-2 pr-4">
                  {variant.price ? `$${variant.price.toString()}` : "—"}
                </td>
                <td className="py-2 pr-4">
                  {variant.inventory?.quantity ?? 0}
                </td>
                <td className="py-2 pr-4">{variant.isDefault ? "Yes" : ""}</td>
                <td className="py-2 pr-4">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/products/${productId}/variants/${variant.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteVariantButton
                      variantId={variant.id}
                      productId={productId}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
