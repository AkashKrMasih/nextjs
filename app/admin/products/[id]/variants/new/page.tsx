import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { getProduct } from "../actions";
import { VariantForm } from "../variant-form";

export default async function NewVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  const product = await getProduct(productId);
  if (!product) notFound();

  return (
    <div className="p-6">
      <PageHeader
        title={`New variant — ${product.name}`}
        description="Add a purchasable SKU for this product."
        backHref={`/admin/products/${productId}/variants`}
        backLabel="Back to variants"
        variant="admin"
        className="mb-6"
      />
      <VariantForm productId={productId} />
    </div>
  );
}
