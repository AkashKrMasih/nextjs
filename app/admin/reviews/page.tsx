import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { ReviewAdminActions } from "./review-admin-actions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-800",
    PENDING: "bg-amber-100 text-amber-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      product: {
        select: {
          id: true,
          name: true,
          friendlyId: true,
          images: { take: 1, orderBy: { isPrimary: "desc" } },
        },
      },
      images: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          title="Product reviews"
          description="Customer reviews across all products."
          variant="admin"
          overline="Moderation"
        />

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {reviews.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No reviews yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Review
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => {
                  const thumb = review.product.images[0]?.url ?? null;
                  return (
                    <tr key={review.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                N/A
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/admin/products/${review.product.id}/edit`}
                            className="text-sm font-medium text-gray-900 hover:underline"
                          >
                            {review.product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="max-w-md px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {review.rating}★
                          </span>
                          {statusBadge(review.status)}
                          {review.isVerifiedPurchase ? (
                            <span className="text-xs text-green-700">Verified purchase</span>
                          ) : null}
                        </div>
                        {review.comment ? (
                          <p className="mt-1 whitespace-pre-wrap">{review.comment}</p>
                        ) : null}
                        {review.images.length > 0 ? (
                          <div className="mt-2 flex gap-2">
                            {review.images.map((image) => (
                              <a
                                key={image.id}
                                href={image.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block h-12 w-12 overflow-hidden rounded border border-gray-200"
                              >
                                <Image
                                  src={image.url}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {review.user.name ?? review.user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ReviewAdminActions reviewId={review.id} status={review.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
