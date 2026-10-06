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

export function ProductReviews({
  productId,
  friendlyId,
  isLoggedIn,
  currentUserId,
  reviewsEnabled,
  initialAvgRating,
  initialReviewCount,
  userHasReview: initialUserHasReview = false,
}: {
  productId: number;
  friendlyId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  reviewsEnabled: boolean;
  initialAvgRating: number;
  initialReviewCount: number;
  userHasReview?: boolean;
}) {
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(initialUserHasReview);

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

  function onPickImages(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const combined = [...imageFiles, ...picked].slice(0, MAX_IMAGES);
    for (const file of combined) {
      if (file.size > MAX_BYTES) {
        setSubmitError("Each image must be 2MB or smaller");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setSubmitError("Only image files are allowed");
        return;
      }
    }
    setSubmitError(null);
    setImageFiles(combined);
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

    setComment("");
    setImageFiles([]);
    setRating(5);
    setHasUserReview(true);
    setPage(1);
    await loadReviews(1);
  }

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

      {!hasUserReview ? (
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
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`Rate ${n} stars`}
                      className="rounded p-0.5 text-amber-500 transition hover:scale-110"
                    >
                      <Star
                        className={[
                          "size-7",
                          n <= rating ? "fill-amber-400" : "fill-transparent",
                        ].join(" ")}
                      />
                    </button>
                  ))}
                </div>
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
                  onChange={onPickImages}
                  className="mt-1 block w-full text-sm text-stone-600"
                />
                {imageFiles.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                    {imageFiles.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200"
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
              {submitError ? (
                <p className="text-sm text-red-600">{submitError}</p>
              ) : null}
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
      ) : (
        <p className="mt-6 text-sm text-stone-500">You have already reviewed this product.</p>
      )}

      <div className="mt-10 space-y-6">
        {loading ? (
          <p className="text-sm text-stone-500">Loading reviews…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : reviews.length === 0 ? null : (
          reviews.map((review) => (
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
