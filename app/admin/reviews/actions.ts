"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { recalculateProductRating } from "@/lib/recalculate-product-rating";
import { deleteReviewImageFiles } from "@/lib/review-images";
import { revalidatePath } from "next/cache";

export async function updateReviewStatus(
  reviewId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: { status },
      });
      await recalculateProductRating(tx, review.productId);
    });
    revalidatePath("/admin/reviews");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Could not update review" };
  }
}

export async function deleteReview(reviewId: string) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  try {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { images: true },
    });
    if (!existing) throw new Error("NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recalculateProductRating(tx, existing.productId);
    });
    await deleteReviewImageFiles(existing.images.map((image) => image.url));
    revalidatePath("/admin/reviews");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Could not delete review" };
  }
}
