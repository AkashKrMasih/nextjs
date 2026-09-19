"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type VariantFormState = {
  error?: string;
};

function parseAttributes(raw: string | null): Record<string, string> | undefined {
  if (!raw || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Attributes must be a JSON object, e.g. {\"color\":\"Red\",\"size\":\"L\"}");
    }
    return parsed;
  } catch {
    throw new Error('Attributes must be valid JSON, e.g. {"color":"Red","size":"L"}');
  }
}

export async function getProductVariants(productId: number) {
  return prisma.productVariant.findMany({
    where: { productId },
    include: { inventory: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProduct(productId: number) {
  return prisma.product.findUnique({ where: { id: productId } });
}

export async function getVariant(variantId: string) {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true },
  });
}

export async function createVariant(
  productId: number,
  _prevState: VariantFormState,
  formData: FormData
): Promise<VariantFormState> {
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const attributesRaw = String(formData.get("attributes") ?? "");
  const isDefault = formData.get("isDefault") === "on";
  const quantityRaw = String(formData.get("quantity") ?? "0").trim();

  if (!sku) {
    return { error: "SKU is required." };
  }

  let attributes: Record<string, string> | undefined;
  try {
    attributes = parseAttributes(attributesRaw);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid attributes." };
  }

  const price = priceRaw ? Number(priceRaw) : null;
  if (priceRaw && Number.isNaN(price)) {
    return { error: "Price must be a number." };
  }

  const quantity = Number(quantityRaw);
  if (Number.isNaN(quantity) || quantity < 0) {
    return { error: "Quantity must be a non-negative number." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Only one variant per product may be marked as default.
      if (isDefault) {
        await tx.productVariant.updateMany({
          where: { productId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku,
          name: name || null,
          price: price ?? undefined,
          attributes: attributes ?? undefined,
          isDefault,
        },
      });

      await tx.inventory.create({
        data: { variantId: variant.id, quantity },
      });
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { error: "That SKU is already in use." };
    }
    return { error: "Failed to create variant." };
  }

  revalidatePath(`/admin/products/${productId}/variants`);
  redirect(`/admin/products/${productId}/variants`);
}

export async function updateVariant(
  variantId: string,
  productId: number,
  _prevState: VariantFormState,
  formData: FormData
): Promise<VariantFormState> {
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const attributesRaw = String(formData.get("attributes") ?? "");
  const isDefault = formData.get("isDefault") === "on";
  const quantityRaw = String(formData.get("quantity") ?? "0").trim();

  if (!sku) {
    return { error: "SKU is required." };
  }

  let attributes: Record<string, string> | undefined;
  try {
    attributes = parseAttributes(attributesRaw);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid attributes." };
  }

  const price = priceRaw ? Number(priceRaw) : null;
  if (priceRaw && Number.isNaN(price)) {
    return { error: "Price must be a number." };
  }

  const quantity = Number(quantityRaw);
  if (Number.isNaN(quantity) || quantity < 0) {
    return { error: "Quantity must be a non-negative number." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.productVariant.updateMany({
          where: { productId, isDefault: true, NOT: { id: variantId } },
          data: { isDefault: false },
        });
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          sku,
          name: name || null,
          price: price ?? null,
          attributes: attributes ?? undefined,
          isDefault,
        },
      });

      await tx.inventory.upsert({
        where: { variantId },
        create: { variantId, quantity },
        update: { quantity },
      });
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { error: "That SKU is already in use." };
    }
    return { error: "Failed to update variant." };
  }

  revalidatePath(`/admin/products/${productId}/variants`);
  redirect(`/admin/products/${productId}/variants`);
}

export async function deleteVariant(
  variantId: string,
  productId: number
): Promise<{ error?: string }> {
  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch (e: any) {
    // FK constraint: variant is referenced by existing cart/order items.
    if (e?.code === "P2003") {
      return {
        error:
          "This variant can't be deleted because it's referenced by existing cart or order items.",
      };
    }
    return { error: "Failed to delete variant." };
  }
  revalidatePath(`/admin/products/${productId}/variants`);
  return {};
}
