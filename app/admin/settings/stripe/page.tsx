import {StripeSettingsForm} from "./StripeSettingsForm";

// Show only the last 4 characters of a secret; never send the full value
// to the client for a read-only, env-driven field.
function mask(value: string) {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(value.length - 4, 20))}${value.slice(-4)}`;
}

export default async function StripeSettingsPage() {
  // If Stripe keys are fixed via environment variables, use those directly
  // and skip the database lookup entirely.
  const envPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const envSecretKey      = process.env.STRIPE_SECRET_KEY;
  const envWebhookSecret  = process.env.STRIPE_WEBHOOK_SECRET;
  const isEnvLocked       = Boolean(envPublishableKey && envSecretKey);

  const settings = {
    publishableKey: envPublishableKey!,
    secretKey:      mask(envSecretKey!),
    webhookSecret:  envWebhookSecret ? mask(envWebhookSecret) : "",
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Stripe API Keys</h1>
      <StripeSettingsForm initialValues={settings}/>
    </div>
  );
}