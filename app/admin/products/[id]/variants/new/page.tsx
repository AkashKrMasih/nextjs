import { notFound } from "next/navigation";
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
      <h1 className="mb-6 text-xl font-semibold">
        New variant — {product.name}
      </h1>
      <VariantForm productId={productId} />
    </div>
  );
}
