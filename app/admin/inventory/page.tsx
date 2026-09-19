import { prisma } from "@/lib/prisma";
import { InventoryTable } from "./inventory-table";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

export default async function InventoryPage({
                                              searchParams,
                                            }: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;

  const variants = await prisma.productVariant.findMany({
    where: q
             ? {
        OR: [
          { sku: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { product: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
             : undefined,
    include: {
      product: { select: { id: true, name: true } },
      inventory: true,
    },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
  });

  const rows = variants.map((v) => {
    const quantity = v.inventory?.quantity ?? 0;
    const reserved = v.inventory?.reserved ?? 0;
    return {
      id: v.id,
      sku: v.sku,
      variantName: v.name,
      productName: v.product.name,
      quantity,
      reserved,
      available: quantity - reserved,
    };
  });

  const lowCount = rows.filter(
    (r) => r.available > 0 && r.available <= LOW_STOCK_THRESHOLD
  ).length;
  const outCount = rows.filter((r) => r.available <= 0).length;

  const visibleRows =
          filter === "low"
            ? rows.filter((r) => r.available > 0 && r.available <= LOW_STOCK_THRESHOLD)
            : filter === "out"
              ? rows.filter((r) => r.available <= 0)
              : rows;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          {rows.length} variant{rows.length === 1 ? "" : "s"} tracked
          {outCount > 0 && <span className="text-red-600"> · {outCount} out of stock</span>}
          {lowCount > 0 && <span className="text-amber-600"> · {lowCount} low stock</span>}
        </p>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/inventory">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search product, variant, or SKU"
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
        <select
          name="filter"
          defaultValue={filter ?? "all"}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="all">All stock</option>
          <option value="low">Low stock (≤ {LOW_STOCK_THRESHOLD})</option>
          <option value="out">Out of stock</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Filter
        </button>
      </form>

      <InventoryTable rows={visibleRows} lowStockThreshold={LOW_STOCK_THRESHOLD} />
    </div>
  );
}