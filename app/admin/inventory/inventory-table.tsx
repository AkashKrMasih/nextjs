"use client";

import { useState, useTransition } from "react";
import { adjustStock } from "./actions";

export type InventoryRow = {
  id: string;
  sku: string;
  variantName: string | null;
  productName: string;
  quantity: number;
  reserved: number;
  available: number;
};

export function InventoryTable({
  rows,
  lowStockThreshold,
}: {
  rows: InventoryRow[];
  lowStockThreshold: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Variant</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 text-right font-medium">Quantity</th>
            <th className="px-4 py-3 text-right font-medium">Reserved</th>
            <th className="px-4 py-3 text-right font-medium">Available</th>
            <th className="px-4 py-3 text-right font-medium">Adjust</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                No variants match this filter.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <InventoryRow key={row.id} row={row} lowStockThreshold={lowStockThreshold} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function InventoryRow({
  row,
  lowStockThreshold,
}: {
  row: InventoryRow;
  lowStockThreshold: number;
}) {
  const [quantity, setQuantity] = useState(row.quantity);
  const [delta, setDelta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const available = quantity - row.reserved;
  const stockLabel = available <= 0 ? "Out of stock" : available <= lowStockThreshold ? "Low" : null;
  const stockClass =
    available <= 0
      ? "bg-red-50 text-red-600"
      : available <= lowStockThreshold
      ? "bg-amber-50 text-amber-600"
      : "text-gray-700";

  function commit(amount: number) {
    if (!amount || isPending) return;
    setError(null);
    const prevQuantity = quantity;
    setQuantity((q) => q + amount); // optimistic

    startTransition(async () => {
      const result = await adjustStock(row.id, amount);
      if (!result.success) {
        setQuantity(prevQuantity);
        setError(result.error);
      } else {
        setQuantity(result.quantity);
      }
    });
  }

  function commitFromInput(sign: 1 | -1) {
    const amount = Number.parseInt(delta, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a whole number greater than 0.");
      return;
    }
    commit(sign * amount);
    setDelta("");
  }

  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900">{row.productName}</td>
      <td className="px-4 py-3 text-gray-600">{row.variantName ?? "Default"}</td>
      <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.sku}</td>
      <td className="px-4 py-3 text-right tabular-nums">{quantity}</td>
      <td className="px-4 py-3 text-right tabular-nums text-gray-500">{row.reserved}</td>
      <td className="px-4 py-3 text-right">
        <span className={`rounded px-2 py-0.5 tabular-nums ${stockClass}`}>{available}</span>
        {stockLabel && <div className="mt-0.5 text-[11px] text-gray-400">{stockLabel}</div>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => commit(-1)}
            className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            aria-label={`Remove one from ${row.sku}`}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="0"
            disabled={isPending}
            className="w-14 rounded border border-gray-300 px-1 py-1 text-center text-xs"
            aria-label={`Adjustment amount for ${row.sku}`}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => commit(1)}
            className="h-7 w-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            aria-label={`Add one to ${row.sku}`}
          >
            +
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => commitFromInput(-1)}
            className="ml-1 whitespace-nowrap rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Stock out
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => commitFromInput(1)}
            className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800 disabled:opacity-40"
          >
            Stock in
          </button>
        </div>
        {error && <div className="mt-1 text-right text-[11px] text-red-500">{error}</div>}
      </td>
    </tr>
  );
}