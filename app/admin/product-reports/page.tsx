import Image from "next/image";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// This assumes a ProductReport model on this shape exists in schema.prisma:
//
//   model ProductReport {
//     id            String       @id @default(cuid())
//     reason        String
//     status        ReportStatus @default(PENDING)
//     reporterName  String?
//     reporterEmail String?
//     product       Product      @relation(fields: [productId], references: [id])
//     productId     String
//     createdAt     DateTime     @default(now())
//   }
//   enum ReportStatus { PENDING RESOLVED DISMISSED }
//
// If you haven't added it yet, add the model + enum above, then run:
//   npx prisma migrate dev --name add_product_reports
// ---------------------------------------------------------------------------

type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

interface ReportedProduct {
  id: string;
  name: string;
  friendlyId: string;
  imageUrl: string | null;
}

interface ProductReport {
  id: string;
  reason: string;
  status: ReportStatus;
  reporterEmail: string | null;
  createdAt: string; // ISO date
  product: ReportedProduct;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getProductReports(): Promise<ProductReport[]> {
  const reports = await prisma.productReport.findMany({
    include: {
      product: {
        include: { images: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reports.map((report) => {
    const primaryImage =
            report.product.images.find((image) => image.isPrimary) ??
            report.product.images[0] ??
            null;

    return {
      id: report.id,
      reason: report.reason,
      status: report.status as ReportStatus,
      reporterEmail: report.reporterEmail,
      createdAt: report.createdAt.toISOString(),
      product: {
        id: report.product.id,
        name: report.product.name,
        friendlyId: report.product.friendlyId,
        imageUrl: primaryImage?.url ?? null,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RESOLVED: "bg-green-50 text-green-700 ring-green-600/20",
  DISMISSED: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductReportsPage() {
  const reports = await getProductReports();
  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Product reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {pendingCount} pending report{pendingCount === 1 ? "" : "s"} to
              review
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {reports.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No reports yet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Reported by
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {report.product.imageUrl ? (
                          <Image
                            src={report.product.imageUrl}
                            alt={report.product.name}
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
                      <a
                        href={`/admin/products/${report.product.friendlyId}`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        {report.product.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {report.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {report.reporterEmail ?? "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {report.status === "PENDING" ? (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="font-medium text-gray-900 hover:underline"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className="font-medium text-gray-500 hover:underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}