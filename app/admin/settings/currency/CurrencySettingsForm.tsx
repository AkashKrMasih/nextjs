"use client";

import {useState} from "react";
import {type CurrencySettings} from "./actions";

export default function CurrencySettingsForm({
                                               initialData,
                                             }: {
  initialData: CurrencySettings | null;
}) {
  const [symbol, setSymbol] = useState(initialData?.symbol ?? "$");
  const [code, setCode]     = useState(initialData?.code ?? "USD");

  return (
    <form className="space-y-4">
      <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        Currency is set via environment variables and can&apos;t be changed here.
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Currency Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="INR"
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          required
          readOnly={true}
          disabled={true}
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
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          required
          readOnly={true}
          disabled={true}
        />
      </div>

    </form>
  );
}