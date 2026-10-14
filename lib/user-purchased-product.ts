import { prisma } from "@/lib/prisma";

/** True when the user has at least one paid order containing this product. */
export async function userHasPurchasedProduct(
  userId: string,
  productId: number
): Promise<boolean> {
  const item = await prisma.orderItem.findFirst({
    where: {
      order: { userId, status: "PAID" },
      variant: { productId },
    },
    select: { id: true },
  });
  return item != null;
}
