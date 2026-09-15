import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth"; // adjust to your auth solution
import { updateReviewSchema } from "@/lib/validations/review";

// PATCH /api/reviews/[reviewId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
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

  const isOwner = existing.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...parsed.data,
        // if a non-admin edits their review, send it back for moderation
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
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = existing.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recalculateProductRating(tx, existing.productId);
  });

  return NextResponse.json({ success: true });
}

async function recalculateProductRating(
  tx: Prisma.TransactionClient,
  productId: string
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