import { z } from 'zod';

// Enum of supported currencies
export const currencyEnum = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
] as const;

export const currencySchema = z.enum(currencyEnum);

// Input schema for conversion request
export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive(),
  source_currency: currencySchema,
  target_currency: currencySchema,
});

export type ConvertCurrencyInput = z.infer<typeof convertCurrencyInputSchema>;

// Output schema for conversion response
export const convertCurrencyOutputSchema = z.object({
  converted_amount: z.number(),
  source_currency: currencySchema,
  target_currency: currencySchema,
});

export type ConvertCurrencyOutput = z.infer<typeof convertCurrencyOutputSchema>;
