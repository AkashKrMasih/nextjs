"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type AdjustStockResult =
  | { success: true; quantity: number }
  | { success: false; error: string };

/**
 * Adjusts a variant's stock by a delta (positive = stock in, negative = stock out).
 * Uses a transaction so concurrent adjustments can't race each other, and creates
 * the Inventory row on first adjustment if the variant doesn't have one yet.
 */
export async function adjustStock(
  variantId: string,
  delta: number
): Promise<AdjustStockResult> {
  if (!Number.isInteger(delta) || delta === 0) {
    return { success: false, error: "Enter a non-zero whole number." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findUnique({
        where: { variantId },
        select: { quantity: true },
      });

      const nextQuantity = (existing?.quantity ?? 0) + delta;

      if (nextQuantity < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      return tx.inventory.upsert({
        where: { variantId },
        update: { quantity: nextQuantity },
        create: { variantId, quantity: nextQuantity },
      });
    });

    revalidatePath("/admin/inventory");
    return { success: true, quantity: result.quantity };
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { success: false, error: "Can't remove more than what's in stock." };
    }
    console.error("adjustStock failed:", err);
    return { success: false, error: "Something went wrong. Try again." };
  }
}