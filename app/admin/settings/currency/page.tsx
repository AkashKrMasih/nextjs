import CurrencySettingsForm from "./CurrencySettingsForm";

export default async function CurrencySettingsPage() {
  // If currency is fixed via environment variables, use that directly
  // and skip the database lookup entirely.
  const envCode = process.env.CURRENCY_CODE;
  const envSymbol = process.env.CURRENCY_SYMBOL;

  const currency = { code: envCode!, symbol: envSymbol! }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Currency Settings</h1>
      <CurrencySettingsForm initialData={currency} />
    </div>
  );
}