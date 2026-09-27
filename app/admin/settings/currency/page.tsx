import { PageHeader } from "@/app/components/PageHeader";
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
      <PageHeader
        title="Currency"
        description="Set the storefront currency symbol and code."
        variant="admin"
        overline="Settings"
        className="mb-6"
      />
      <CurrencySettingsForm initialData={currency} />
    </div>
  );
}