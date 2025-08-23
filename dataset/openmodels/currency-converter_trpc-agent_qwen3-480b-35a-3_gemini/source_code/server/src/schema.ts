import { z } from 'zod';

// Schema for currency conversion input
export const convertCurrencyInputSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3).toUpperCase(), // Currency codes are 3 letters
  to: z.string().length(3).toUpperCase(),
});

export type ConvertCurrencyInput = z.infer<typeof convertCurrencyInputSchema>;

// Schema for currency conversion result
export const currencyConversionResultSchema = z.object({
  amount: z.number(),
  from: z.string(),
  to: z.string(),
  convertedAmount: z.number(),
  exchangeRate: z.number(),
  timestamp: z.coerce.date(),
});

export type CurrencyConversionResult = z.infer<typeof currencyConversionResultSchema>;

// Schema for available currencies
export const currencySchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;
