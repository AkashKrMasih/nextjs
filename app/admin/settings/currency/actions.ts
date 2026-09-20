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


export async function getCurrencySymbol(): Promise<string> {
  const settings = await getCurrencySettings();
  const symbol   = settings?.symbol?.trim();
  return symbol ? symbol : DEFAULT_CURRENCY.symbol;
}