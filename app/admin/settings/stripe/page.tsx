import { getStripeSettings } from "./actions";
import { StripeSettingsForm } from "./StripeSettingsForm";

export default async function StripeSettingsPage() {
  const settings = await getStripeSettings();

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Stripe API Keys</h1>
      <StripeSettingsForm initialValues={settings} />
    </div>
  );
}