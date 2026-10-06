import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createReviewFieldsSchema,
  listReviewsQuerySchema,
} from "@/lib/validations/review";
import { saveReviewImages } from "@/lib/review-images";
import { userHasPurchasedProduct } from "@/lib/user-purchased-product";
import { recalculateProductRating } from "@/lib/recalculate-product-rating";

const SORT_MAP = {
  newest: { createdAt: "desc" as const },
  oldest: { createdAt: "asc" as const },
  highest: { rating: "desc" as const },
  lowest: { rating: "asc" as const },
  helpful: { helpfulCount: "desc" as const },
};

function parseProductId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

// GET /api/products/[id]/reviews
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseProductId(id);
  if (productId == null) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, reviewsEnabled: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

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

  const [reviews, total, ratingBreakdown, summary] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: SORT_MAP[sort],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
        images: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: true,
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { avgRating: true, reviewCount: true, reviewsEnabled: true },
    }),
  ]);

  return NextResponse.json({
    reviews,
    reviewsEnabled: summary?.reviewsEnabled ?? true,
    avgRating: summary?.avgRating ?? 0,
    reviewCount: summary?.reviewCount ?? 0,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ratingBreakdown,
  });
}

// POST /api/products/[id]/reviews — multipart: rating, comment, title?, images[]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseProductId(id);
  if (productId == null) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, reviewsEnabled: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (!product.reviewsEnabled) {
    return NextResponse.json(
      { error: "Reviews are disabled for this product" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const parsed = createReviewFieldsSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
    title: formData.get("title") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { rating, title, comment } = parsed.data;

  const imageFiles = formData.getAll("images").filter(
    (entry): entry is File => entry instanceof File
  );
  const savedImages = await saveReviewImages(imageFiles);
  if ("error" in savedImages) {
    return NextResponse.json({ error: savedImages.error }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: session.userId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this product" },
      { status: 409 }
    );
  }

  const isVerifiedPurchase = await userHasPurchasedProduct(
    session.userId,
    productId
  );

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId,
        userId: session.userId,
        rating,
        title,
        comment,
        status: "APPROVED",
        isVerifiedPurchase,
        images: savedImages.length
          ? { create: savedImages.map((url) => ({ url })) }
          : undefined,
      },
      include: {
        images: true,
        user: { select: { id: true, name: true } },
      },
    });

    await recalculateProductRating(tx, productId);
    return created;
  });

  return NextResponse.json({ review }, { status: 201 });
}
