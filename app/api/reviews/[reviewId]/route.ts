import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateReviewSchema } from "@/lib/validations/review";
import { recalculateProductRating } from "@/lib/recalculate-product-rating";

// PATCH /api/reviews/[reviewId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const body = await req.json();
  const parsed = updateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = existing.userId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...parsed.data,
        ...(isOwner && !isAdmin ? { status: "PENDING" } : {}),
      },
    });

    if (parsed.data.rating !== undefined) {
      await recalculateProductRating(tx, existing.productId);
    }

    return updated;
  });

  return NextResponse.json({ review });
}

// DELETE /api/reviews/[reviewId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = existing.userId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recalculateProductRating(tx, existing.productId);
  });

  return NextResponse.json({ success: true });
}
