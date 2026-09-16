"use client";

import { useState, useTransition } from "react";
import { saveStripeSettings, type StripeKeys } from "./actions";

export function StripeSettingsForm({
                                     initialValues,
                                   }: {
  initialValues: StripeKeys | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setErrors(null);
    startTransition(async () => {
      const result = await saveStripeSettings(formData);
      if (result.success) {
        setMessage("Stripe settings saved.");
      } else {
        setErrors(result.error ?? null);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Publishable Key
        </label>
        <input
          name="publishableKey"
          defaultValue={initialValues?.publishableKey ?? ""}
          placeholder="pk_live_..."
          className="w-full border rounded px-3 py-2"
        />
        {errors?.publishableKey && (
          <p className="text-red-600 text-sm">{errors.publishableKey[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Secret Key</label>
        <input
          type="password"
          name="secretKey"
          defaultValue={initialValues?.secretKey ?? ""}
          placeholder="sk_live_..."
          className="w-full border rounded px-3 py-2"
        />
        {errors?.secretKey && (
          <p className="text-red-600 text-sm">{errors.secretKey[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Webhook Secret (optional)
        </label>
        <input
          type="password"
          name="webhookSecret"
          defaultValue={initialValues?.webhookSecret ?? ""}
          placeholder="whsec_..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>

      {message && <p className="text-green-600 text-sm">{message}</p>}
    </form>
  );
}