"use client";

import { useTransition } from "react";
import { deleteReview, updateReviewStatus } from "./actions";

export function ReviewAdminActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status !== "APPROVED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateReviewStatus(reviewId, "APPROVED"))}
          className="text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
        >
          Approve
        </button>
      ) : null}
      {status !== "REJECTED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateReviewStatus(reviewId, "REJECTED"))}
          className="text-sm font-medium text-amber-700 hover:underline disabled:opacity-50"
        >
          Reject
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => deleteReview(reviewId))}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
