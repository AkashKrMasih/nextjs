import { notFound } from "next/navigation";
import { getProduct, getVariant } from "../actions";
import { VariantForm } from "../variant-form";

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  const [product, variant] = await Promise.all([
    getProduct(productId),
    getVariant(variantId),
  ]);

  if (!product || !variant || variant.productId !== productId) notFound();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">
        Edit variant — {product.name}
      </h1>
      <VariantForm
        productId={productId}
        variant={{
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price ? variant.price.toString() : null,
          attributes: (variant.attributes as Record<string, string>) ?? null,
          isDefault: variant.isDefault,
          inventory: variant.inventory
            ? { quantity: variant.inventory.quantity }
            : null,
        }}
      />
    </div>
  );
}
