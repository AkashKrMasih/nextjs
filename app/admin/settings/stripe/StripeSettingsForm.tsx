"use client";

import { useState, useTransition } from "react";

export function StripeSettingsForm({
                                     initialValues,
                                   }: {
  initialValues: {} | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Publishable Key
        </label>
        <input
          name="publishableKey"
          defaultValue={initialValues?.publishableKey ?? ""}
          placeholder="pk_live_..."
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          readOnly={true}
          disabled={true}
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
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          readOnly={true}
          disabled={true}
        />
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
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          readOnly={true}
          disabled={true}
        />
      </div>

    </form>
  );
}