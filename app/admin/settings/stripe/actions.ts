"use server";

import {z} from "zod";

const StripeSchema = z.object({
  publishableKey: z.string().min(1, "Publishable key is required"),
  secretKey:      z.string().min(1, "Secret key is required"),
  webhookSecret:  z.string().optional().default(""),
});

export type StripeKeys = z.infer<typeof StripeSchema>;
