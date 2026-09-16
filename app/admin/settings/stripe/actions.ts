"use server";

import {prisma} from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {z} from "zod";

const StripeSchema = z.object({
  publishableKey: z.string().min(1, "Publishable key is required"),
  secretKey:      z.string().min(1, "Secret key is required"),
  webhookSecret:  z.string().optional().default(""),
});

export type StripeKeys = z.infer<typeof StripeSchema>;

// READS the single row (id: 1) from AdminSettings.stripe
export async function getStripeSettings(): Promise<StripeKeys | null> {
  const row = await prisma.adminSettings.findUnique({where: {id: 1}});
  if (!row?.stripe) return null;
  return row.stripe as StripeKeys;
}

// WRITES/UPSERTS the single row (id: 1) in AdminSettings.stripe
export async function saveStripeSettings(formData: FormData) {
  const parsed = StripeSchema.safeParse({
    publishableKey: formData.get("publishableKey"),
    secretKey:      formData.get("secretKey"),
    webhookSecret:  formData.get("webhookSecret"),
  });

  if (!parsed.success) {
    return {success: false, error: parsed.error.flatten().fieldErrors};
  }

  await prisma.adminSettings.upsert({
    where:  {id: 1},
    update: {stripe: parsed.data},
    create: {id: 1, stripe: parsed.data},
  });

  revalidatePath("/admin/stripe-settings");
  return {success: true};
}

export async function getPublishableKey(): Promise<string> {
  const settings = await getStripeSettings();
  return settings?.publishableKey?.trim();
}

/**
 * Returns the current system currency symbol (e.g. "₹").
 * Falls back to "$" if not configured or blank.
 */
export async function getSecretKey(): Promise<string> {
  const settings = await getStripeSettings();
  return settings?.secretKey?.trim();
}