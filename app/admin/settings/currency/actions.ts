"use server";

import {prisma} from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {DEFAULT_CURRENCY} from "@/app/admin/settings/currency/constants";

const currencySchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(5),
  code:   z
          .string()
          .length(3, "Currency code must be 3 letters")
          .transform((v) => v.toUpperCase()),
});

export type CurrencySettings = z.infer<typeof currencySchema>;

export async function getCurrencySettings(): Promise<CurrencySettings | null> {
  const settings = await prisma.adminSettings.findUnique({
    where:  {id: 1},
    select: {currency: true},
  });

  if (!settings?.currency) return null;
  return settings.currency as CurrencySettings;
}

export async function updateCurrencySettings(
  input: CurrencySettings
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = currencySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:   parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  await prisma.adminSettings.upsert({
    where:  {id: 1},
    update: {currency: parsed.data},
    create: {id: 1, currency: parsed.data},
  });

  revalidatePath("/admin/settings/currency");
  return {success: true};
}

/**
 * Returns the current system currency code (e.g. "INR").
 * Falls back to "USD" if not configured or blank.
 */
export async function getCurrencyCode(): Promise<string> {
  const settings = await getCurrencySettings();
  const code     = settings?.code?.trim();
  return code ? code : DEFAULT_CURRENCY.code;
}

/**
 * Returns the current system currency symbol (e.g. "₹").
 * Falls back to "$" if not configured or blank.
 */
export async function getCurrencySymbol(): Promise<string> {
  const settings = await getCurrencySettings();
  const symbol   = settings?.symbol?.trim();
  return symbol ? symbol : DEFAULT_CURRENCY.symbol;
}