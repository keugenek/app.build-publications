import { z } from 'zod';

// Currency schema
export const currencySchema = z.object({
  code: z.string().length(3), // ISO 4217 currency code (3 letters)
  name: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;

// Currency conversion input schema
export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive(), // Amount to convert
  from: z.string().length(3), // Source currency code
  to: z.string().length(3), // Target currency code
});

export type ConvertCurrencyInput = z.infer<typeof convertCurrencyInputSchema>;

// Currency conversion result schema
export const conversionResultSchema = z.object({
  amount: z.number(),
  convertedAmount: z.number(),
  from: z.string(),
  to: z.string(),
  rate: z.number(),
  timestamp: z.coerce.date(),
});

export type ConversionResult = z.infer<typeof conversionResultSchema>;

// Available currencies schema
export const currenciesSchema = z.record(z.string(), z.string()); // Record of currency code to name
export type Currencies = z.infer<typeof currenciesSchema>;
