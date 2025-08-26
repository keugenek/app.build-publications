import { z } from 'zod';

// Currency conversion request schema
export const currencyConversionRequestSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3).toUpperCase(), // ISO 4217 currency codes (e.g., USD, EUR)
  to: z.string().length(3).toUpperCase()
});

export type CurrencyConversionRequest = z.infer<typeof currencyConversionRequestSchema>;

// Currency conversion response schema
export const currencyConversionResponseSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3),
  result: z.number().positive(),
  rate: z.number().positive(),
  date: z.string(), // ISO date string from Frankfurter API
  converted_at: z.coerce.date()
});

export type CurrencyConversionResponse = z.infer<typeof currencyConversionResponseSchema>;

// Exchange rate schema for storing cached rates
export const exchangeRateSchema = z.object({
  id: z.number(),
  from_currency: z.string().length(3),
  to_currency: z.string().length(3),
  rate: z.number().positive(),
  date: z.string(), // ISO date string
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

// Input schema for creating exchange rates
export const createExchangeRateInputSchema = z.object({
  from_currency: z.string().length(3).toUpperCase(),
  to_currency: z.string().length(3).toUpperCase(),
  rate: z.number().positive(),
  date: z.string()
});

export type CreateExchangeRateInput = z.infer<typeof createExchangeRateInputSchema>;

// Supported currencies schema
export const supportedCurrenciesSchema = z.array(z.object({
  code: z.string().length(3),
  name: z.string()
}));

export type SupportedCurrencies = z.infer<typeof supportedCurrenciesSchema>;
