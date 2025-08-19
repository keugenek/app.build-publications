import { z } from 'zod';

// Currency schema for available currencies
export const currencySchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;

// Conversion request input schema
export const conversionRequestSchema = z.object({
  amount: z.number().positive(),
  from_currency: z.string().length(3), // 3-letter currency code (e.g., USD, EUR)
  to_currency: z.string().length(3),
});

export type ConversionRequest = z.infer<typeof conversionRequestSchema>;

// Conversion result schema
export const conversionResultSchema = z.object({
  id: z.number(),
  amount: z.number(),
  from_currency: z.string(),
  to_currency: z.string(),
  exchange_rate: z.number(),
  converted_amount: z.number(),
  created_at: z.coerce.date(),
});

export type ConversionResult = z.infer<typeof conversionResultSchema>;

// Input schema for creating conversion records
export const createConversionInputSchema = z.object({
  amount: z.number().positive(),
  from_currency: z.string().length(3),
  to_currency: z.string().length(3),
  exchange_rate: z.number().positive(),
  converted_amount: z.number().positive(),
});

export type CreateConversionInput = z.infer<typeof createConversionInputSchema>;

// Frankfurter API response schema for available currencies
export const frankfurterCurrenciesResponseSchema = z.record(z.string(), z.string());

export type FrankfurterCurrenciesResponse = z.infer<typeof frankfurterCurrenciesResponseSchema>;

// Frankfurter API response schema for exchange rates
export const frankfurterExchangeResponseSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export type FrankfurterExchangeResponse = z.infer<typeof frankfurterExchangeResponseSchema>;
