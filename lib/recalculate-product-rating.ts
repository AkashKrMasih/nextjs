import type { Prisma } from "@/app/generated/prisma/client";

export async function recalculateProductRating(
  tx: Prisma.TransactionClient,
  productId: number
) {
  const agg = await tx.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}
