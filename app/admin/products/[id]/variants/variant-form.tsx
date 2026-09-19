"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createVariant,
  updateVariant,
  type VariantFormState,
} from "./actions";

type VariantFormProps = {
  productId: number;
  variant?: {
    id: string;
    sku: string;
    name: string | null;
    price: string | null; // Decimal serialized as string
    attributes: Record<string, string> | null;
    isDefault: boolean;
    inventory: { quantity: number } | null;
  };
};

const initialState: VariantFormState = {};

export function VariantForm({ productId, variant }: VariantFormProps) {
  const isEdit = Boolean(variant);

  const action = isEdit
    ? updateVariant.bind(null, variant!.id, productId)
    : createVariant.bind(null, productId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  const attributesDefault = variant?.attributes
    ? JSON.stringify(variant.attributes, null, 2)
    : "";

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="sku" className="block text-sm font-medium">
          SKU
        </label>
        <input
          id="sku"
          name="sku"
          defaultValue={variant?.sku}
          required
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span className="text-gray-400">(e.g. &quot;Red / Large&quot;)</span>
        </label>
        <input
          id="name"
          name="name"
          defaultValue={variant?.name ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium">
          Price override <span className="text-gray-400">(leave blank to use product price)</span>
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={variant?.price ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium">
          Stock quantity
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          defaultValue={variant?.inventory?.quantity ?? 0}
          required
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="attributes" className="block text-sm font-medium">
          Attributes <span className="text-gray-400">(JSON, optional)</span>
        </label>
        <textarea
          id="attributes"
          name="attributes"
          rows={4}
          defaultValue={attributesDefault}
          placeholder='{"color":"Red","size":"L"}'
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          defaultChecked={variant?.isDefault ?? false}
          className="h-4 w-4"
        />
        <label htmlFor="isDefault" className="text-sm font-medium">
          Default variant for this product
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create variant"}
        </button>
        <Link
          href={`/admin/products/${productId}/variants`}
          className="text-sm text-gray-500 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
