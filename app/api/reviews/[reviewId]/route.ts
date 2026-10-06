import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  updateReviewFieldsSchema,
  updateReviewSchema,
} from "@/lib/validations/review";
import { recalculateProductRating } from "@/lib/recalculate-product-rating";
import {
  deleteReviewImageFiles,
  MAX_REVIEW_IMAGES,
  saveReviewImages,
} from "@/lib/review-images";

function parseRemoveImageIds(raw: FormDataEntryValue | null): string[] {
  if (raw == null || raw === "") return [];
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

// PATCH /api/reviews/[reviewId] — JSON (admin/text) or multipart (owner + images)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = existing.userId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  if (isMultipart) {
    const formData = await req.formData();
    const parsed = updateReviewFieldsSchema.safeParse({
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

    const removeImageIds = parseRemoveImageIds(formData.get("removeImageIds"));
    const newFiles = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const ownedImageIds = new Set(existing.images.map((image) => image.id));
    if (removeImageIds.some((id) => !ownedImageIds.has(id))) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const keptCount = existing.images.length - removeImageIds.length;
    const totalAfter = keptCount + newFiles.length;
    if (totalAfter > MAX_REVIEW_IMAGES) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_REVIEW_IMAGES} images per review` },
        { status: 400 }
      );
    }

    const saved = await saveReviewImages(newFiles, MAX_REVIEW_IMAGES - keptCount);
    if ("error" in saved) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }

    const removedUrls = existing.images
      .filter((image) => removeImageIds.includes(image.id))
      .map((image) => image.url);

    const review = await prisma.$transaction(async (tx) => {
      if (removeImageIds.length) {
        await tx.reviewImage.deleteMany({
          where: { id: { in: removeImageIds }, reviewId },
        });
      }
      if (saved.length) {
        await tx.reviewImage.createMany({
          data: saved.map((url) => ({ url, reviewId })),
        });
      }

      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: parsed.data.rating,
          comment: parsed.data.comment,
          title: parsed.data.title,
          ...(isOwner && !isAdmin ? { status: "APPROVED" } : {}),
        },
        include: {
          images: true,
          user: { select: { id: true, name: true } },
        },
      });

      await recalculateProductRating(tx, existing.productId);
      return updated;
    });

    await deleteReviewImageFiles(removedUrls);
    return NextResponse.json({ review });
  }

  const body = await req.json();
  const parsed = updateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...parsed.data,
        ...(isOwner && !isAdmin ? { status: "APPROVED" } : {}),
      },
      include: {
        images: true,
        user: { select: { id: true, name: true } },
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
  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = existing.userId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const imageUrls = existing.images.map((image) => image.url);

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recalculateProductRating(tx, existing.productId);
  });

  await deleteReviewImageFiles(imageUrls);

  return NextResponse.json({ success: true });
}
