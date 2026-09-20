import CurrencySettingsForm from "./CurrencySettingsForm";
import {DEFAULT_CURRENCY} from "./constants";

export default async function CurrencySettingsPage() {
  // Currency is fixed via environment variables (falling back to the
  // app default), so skip the database lookup entirely.
  const currency = {
    code: process.env.CURRENCY_CODE ?? DEFAULT_CURRENCY.code,
    symbol: process.env.CURRENCY_SYMBOL ?? DEFAULT_CURRENCY.symbol,
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Currency Settings</h1>
      <CurrencySettingsForm initialData={currency} />
    </div>
  );
}