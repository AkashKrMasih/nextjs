"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";

type ReviewImage = { id: string; url: string };

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string | null };
  images: ReviewImage[];
};

type OwnReview = {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  images: ReviewImage[];
};

type ReviewsResponse = {
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  reviewsEnabled: boolean;
  pagination: { page: number; totalPages: number; total: number };
};

const MAX_IMAGES = 2;
const MAX_BYTES = 2 * 1024 * 1024;

function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const iconClass = size === "lg" ? "size-5" : "size-4";
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={[iconClass, n <= value ? "fill-amber-400" : "fill-transparent"].join(" ")}
        />
      ))}
    </span>
  );
}

function StarPicker({ rating, onChange }: { rating: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} stars`}
          className="rounded p-0.5 text-amber-500 transition hover:scale-110"
        >
          <Star
            className={["size-7", n <= rating ? "fill-amber-400" : "fill-transparent"].join(" ")}
          />
        </button>
      ))}
    </div>
  );
}

function validateImageFiles(files: File[]): string | null {
  for (const file of files) {
    if (file.size > MAX_BYTES) return "Each image must be 2MB or smaller";
    if (!file.type.startsWith("image/")) return "Only image files are allowed";
  }
  return null;
}

export function ProductReviews({
  productId,
  friendlyId,
  isLoggedIn,
  currentUserId,
  reviewsEnabled,
  initialAvgRating,
  initialReviewCount,
  ownReview: initialOwnReview = null,
}: {
  productId: number;
  friendlyId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  reviewsEnabled: boolean;
  initialAvgRating: number;
  initialReviewCount: number;
  ownReview?: OwnReview | null;
}) {
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [ownReview, setOwnReview] = useState<OwnReview | null>(initialOwnReview);
  const [isEditingOwn, setIsEditingOwn] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [keptImages, setKeptImages] = useState<ReviewImage[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async (pageNum: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/products/${productId}/reviews?page=${pageNum}&limit=10&sort=newest`
      );
      const data = (await res.json()) as ReviewsResponse & { error?: string };
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load reviews");
        return;
      }
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setReviewCount(data.reviewCount);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setLoadError("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!reviewsEnabled) {
      setLoading(false);
      return;
    }
    void loadReviews(page);
  }, [reviewsEnabled, page, loadReviews]);

  function resetComposeForm() {
    setRating(5);
    setComment("");
    setImageFiles([]);
    setKeptImages([]);
    setSubmitError(null);
  }

  function startEditing() {
    if (!ownReview) return;
    setRating(ownReview.rating);
    setComment(ownReview.comment);
    setKeptImages(ownReview.images);
    setImageFiles([]);
    setSubmitError(null);
    setIsEditingOwn(true);
  }

  function cancelEditing() {
    setIsEditingOwn(false);
    resetComposeForm();
  }

  function onPickImages(
    event: React.ChangeEvent<HTMLInputElement>,
    existingCount: number
  ) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const combined = [...imageFiles, ...picked];
    const maxNew = MAX_IMAGES - existingCount;
    if (combined.length > maxNew) {
      setSubmitError(`You can have at most ${MAX_IMAGES} images per review`);
      return;
    }
    const err = validateImageFiles(combined);
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setImageFiles(combined);
  }

  function removeKeptImage(imageId: string) {
    setKeptImages((prev) => prev.filter((image) => image.id !== imageId));
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoggedIn) return;
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment.trim());
    for (const file of imageFiles) {
      formData.append("images", file);
    }

    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      body: formData,
    });
    const payload = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(payload.error ?? "Could not submit review");
      return;
    }

    const created = payload.review as Review;
    setOwnReview({
      id: created.id,
      rating: created.rating,
      comment: created.comment ?? "",
      isVerifiedPurchase: created.isVerifiedPurchase,
      images: created.images ?? [],
    });
    resetComposeForm();
    setPage(1);
    await loadReviews(1);
  }

  async function saveOwnReview(event: React.FormEvent) {
    event.preventDefault();
    if (!ownReview) return;

    const removedIds = ownReview.images
      .filter((image) => !keptImages.some((kept) => kept.id === image.id))
      .map((image) => image.id);

    if (keptImages.length + imageFiles.length > MAX_IMAGES) {
      setSubmitError(`You can have at most ${MAX_IMAGES} images per review`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment.trim());
    formData.set("removeImageIds", JSON.stringify(removedIds));
    for (const file of imageFiles) {
      formData.append("images", file);
    }

    const res = await fetch(`/api/reviews/${ownReview.id}`, {
      method: "PATCH",
      body: formData,
    });
    const payload = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(payload.error ?? "Could not update review");
      return;
    }

    const updated = payload.review as Review;
    setOwnReview({
      id: updated.id,
      rating: updated.rating,
      comment: updated.comment ?? "",
      isVerifiedPurchase: updated.isVerifiedPurchase,
      images: updated.images ?? [],
    });
    setIsEditingOwn(false);
    resetComposeForm();
    await loadReviews(page);
  }

  async function deleteOwnReview() {
    if (!ownReview) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;

    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch(`/api/reviews/${ownReview.id}`, { method: "DELETE" });
    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error ?? "Could not delete review");
      return;
    }

    setOwnReview(null);
    setIsEditingOwn(false);
    resetComposeForm();
    await loadReviews(page);
  }

  const visibleReviews = ownReview
    ? reviews.filter((review) => review.id !== ownReview.id)
    : reviews;

  const imageSlotCount = isEditingOwn ? keptImages.length + imageFiles.length : imageFiles.length;

  if (!reviewsEnabled) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-stone-200 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-stone-900">Customer reviews</h2>
          {reviewCount > 0 ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-stone-600">
              <Stars value={Math.round(avgRating)} size="lg" />
              <span>
                {avgRating.toFixed(1)} · {reviewCount}{" "}
                {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-stone-500">No reviews yet.</p>
          )}
        </div>
      </div>

      {ownReview && !isEditingOwn ? (
        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-stone-900">Your review</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startEditing}
                disabled={submitting}
                className="text-sm font-medium text-green-800 hover:underline disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void deleteOwnReview()}
                disabled={submitting}
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Stars value={ownReview.rating} />
            {ownReview.isVerifiedPurchase ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
              >
                <BadgeCheck className="size-3.5" />
                Verified purchase
              </span>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {ownReview.comment}
          </p>
          {ownReview.images.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {ownReview.images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-20 w-20 overflow-hidden rounded-xl border border-stone-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {ownReview && isEditingOwn ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/50 p-6">
          <h3 className="text-lg font-medium text-stone-900">Edit your review</h3>
          <form onSubmit={saveOwnReview} className="mt-4 space-y-4">
            <div>
              <span className="block text-sm font-medium text-stone-700">Rating</span>
              <StarPicker rating={rating} onChange={setRating} />
            </div>
            <div>
              <label htmlFor="edit-review-comment" className="block text-sm font-medium text-stone-700">
                Comment
              </label>
              <textarea
                id="edit-review-comment"
                required
                rows={4}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-stone-700">Photos</span>
              {keptImages.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {keptImages.map((image) => (
                    <li key={image.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt=""
                        className="h-20 w-20 rounded-xl border border-stone-200 object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removeKeptImage(image.id)}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs text-white"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={imageSlotCount >= MAX_IMAGES}
                onChange={(e) => onPickImages(e, keptImages.length)}
                className="mt-2 block w-full text-sm text-stone-600"
              />
              <p className="mt-1 text-xs text-stone-500">
                Max {MAX_IMAGES} images, 2MB each ({imageSlotCount}/{MAX_IMAGES} used)
              </p>
              {imageFiles.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                  {imageFiles.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1"
                    >
                      {file.name}
                      <button
                        type="button"
                        className="text-stone-400 hover:text-red-600"
                        onClick={() =>
                          setImageFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={submitting}
                className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {!ownReview ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/50 p-6">
          <h3 className="text-lg font-medium text-stone-900">Write a review</h3>
          {!isLoggedIn ? (
            <p className="mt-2 text-sm text-stone-600">
              <Link
                href={`/login?next=/products/${friendlyId}`}
                className="font-medium text-green-800 underline"
              >
                Sign in
              </Link>{" "}
              to leave a review.
            </p>
          ) : (
            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <div>
                <span className="block text-sm font-medium text-stone-700">Rating</span>
                <StarPicker rating={rating} onChange={setRating} />
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-stone-700">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  required
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm"
                  placeholder="Share your experience with this product"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Photos (optional, max {MAX_IMAGES}, 2MB each)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imageFiles.length >= MAX_IMAGES}
                  onChange={(e) => onPickImages(e, 0)}
                  className="mt-1 block w-full text-sm text-stone-600"
                />
                {imageFiles.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                    {imageFiles.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1"
                      >
                        {file.name}
                        <button
                          type="button"
                          className="text-stone-400 hover:text-red-600"
                          onClick={() =>
                            setImageFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {submitError && ownReview && !isEditingOwn ? (
        <p className="mt-4 text-sm text-red-600">{submitError}</p>
      ) : null}

      <div className="mt-10 space-y-6">
        {loading ? (
          <p className="text-sm text-stone-500">Loading reviews…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : visibleReviews.length === 0 ? null : (
          visibleReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-sm font-medium text-stone-900">
                  {review.user.name ?? "Customer"}
                </span>
                {review.isVerifiedPurchase ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800"
                  >
                    <BadgeCheck className="size-3.5" />
                    Verified purchase
                  </span>
                ) : null}
                <span className="text-xs text-stone-400">
                  {formatReviewDate(review.createdAt)}
                </span>
              </div>
              {review.comment ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {review.comment}
                </p>
              ) : null}
              {review.images.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((image) => (
                    <a
                      key={image.id}
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-20 w-20 overflow-hidden rounded-xl border border-stone-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="self-center text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
