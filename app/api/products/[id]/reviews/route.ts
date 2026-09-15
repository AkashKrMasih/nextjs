import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth"; // adjust to your auth solution (NextAuth `auth()`, Clerk, etc.)
import {
  createReviewSchema,
  listReviewsQuerySchema,
} from "@/lib/validations/review";

const SORT_MAP = {
  newest: { createdAt: "desc" as const },
  oldest: { createdAt: "asc" as const },
  highest: { rating: "desc" as const },
  lowest: { rating: "asc" as const },
  helpful: { helpfulCount: "desc" as const },
};

// GET /api/products/[productId]/reviews?page=1&limit=10&sort=newest&rating=5
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const { searchParams } = new URL(req.url);

  const parsed = listReviewsQuerySchema.safeParse(
    Object.fromEntries(searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { page, limit, sort, rating } = parsed.data;

  const where = {
    productId,
    status: "APPROVED" as const,
    ...(rating ? { rating } : {}),
  };

  const [reviews, total, ratingBreakdown] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: SORT_MAP[sort],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
        images: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ratingBreakdown, // e.g. [{ rating: 5, _count: 12 }, { rating: 4, _count: 3 }]
  });
}

// POST /api/products/[productId]/reviews
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const body = await req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { rating, title, comment, images } = parsed.data;

  // Prevent duplicate reviews (also enforced by @@unique in schema)
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this product" },
      { status: 409 }
    );
  }

  // Optional: verify purchase before allowing review
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.user.id, status: "DELIVERED" },
    },
  });

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title,
        comment,
        isVerifiedPurchase: !!hasPurchased,
        images: images?.length
                  ? { create: images.map((url) => ({ url })) }
                  : undefined,
      },
      include: { images: true },
    });

    await recalculateProductRating(tx, productId);

    return created;
  });

  return NextResponse.json({ review }, { status: 201 });
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