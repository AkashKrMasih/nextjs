import { getCurrencySettings } from "./actions";
import CurrencySettingsForm from "./CurrencySettingsForm";

export default async function CurrencySettingsPage() {
  const currency = await getCurrencySettings();

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Currency Settings</h1>
      <CurrencySettingsForm initialData={currency} />
    </div>
  );
}