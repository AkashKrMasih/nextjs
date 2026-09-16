"use client";

import { useState, useTransition } from "react";
import { updateCurrencySettings, type CurrencySettings } from "./actions";

const COMMON_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "INR", symbol: "₹" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
];

export default function CurrencySettingsForm({
                                               initialData,
                                             }: {
  initialData: CurrencySettings | null;
}) {
  const [symbol, setSymbol] = useState(initialData?.symbol ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handlePreset(preset: { code: string; symbol: string }) {
    setCode(preset.code);
    setSymbol(preset.symbol);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateCurrencySettings({ symbol, code });
      if (result.success) {
        setMessage({ type: "success", text: "Currency settings saved." });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COMMON_CURRENCIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => handlePreset(c)}
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
          >
            {c.symbol} {c.code}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Currency Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="INR"
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Currency Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          maxLength={5}
          placeholder="₹"
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      {message && (
        <p className={message.type === "success" ? "text-green-600" : "text-red-600"}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}