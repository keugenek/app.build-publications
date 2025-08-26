import { z } from 'zod';

// Supported currency codes – using a limited set for example purposes
export const currencyEnum = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
] as const;
export const currencySchema = z.enum(currencyEnum);

// Input schema for a conversion request
export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive(), // Amount must be positive
  source_currency: currencySchema,
  target_currency: currencySchema,
});

export type ConvertCurrencyInput = z.infer<typeof convertCurrencyInputSchema>;

// Output schema representing a conversion result
export const convertCurrencyOutputSchema = z.object({
  amount: z.number(), // Original amount
  source_currency: currencySchema,
  target_currency: currencySchema,
  converted_amount: z.number(), // Result after conversion
  rate: z.number(), // Exchange rate used
  timestamp: z.coerce.date(), // When conversion was performed
});

export type ConvertCurrencyOutput = z.infer<typeof convertCurrencyOutputSchema>;
