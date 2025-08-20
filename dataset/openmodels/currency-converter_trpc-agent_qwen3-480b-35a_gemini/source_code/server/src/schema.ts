import { z } from 'zod';

// Currency schema
export const currencySchema = z.object({
  code: z.string().length(3), // ISO 4217 currency code (e.g., USD, EUR)
  name: z.string(),
  symbol: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;

// Conversion input schema
export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3), // ISO currency code
  toCurrency: z.string().length(3), // ISO currency code
});

export type ConvertCurrencyInput = z.infer<typeof convertCurrencyInputSchema>;

// Conversion result schema
export const conversionResultSchema = z.object({
  amount: z.number(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  convertedAmount: z.number(),
  exchangeRate: z.number(),
  timestamp: z.coerce.date(),
});

export type ConversionResult = z.infer<typeof conversionResultSchema>;

// Conversion history schema
export const conversionHistorySchema = z.object({
  id: z.number(),
  amount: z.number(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  convertedAmount: z.number(),
  exchangeRate: z.number(),
  timestamp: z.coerce.date(),
});

export type ConversionHistory = z.infer<typeof conversionHistorySchema>;
