import { z } from 'zod';

// Common currency codes enum
export const currencyCodeSchema = z.enum([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK'
]);

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

// Currency conversion request schema
export const currencyConversionRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema
});

export type CurrencyConversionRequest = z.infer<typeof currencyConversionRequestSchema>;

// Currency conversion response schema
export const currencyConversionResponseSchema = z.object({
  original_amount: z.number(),
  converted_amount: z.number(),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema,
  exchange_rate: z.number(),
  conversion_date: z.coerce.date()
});

export type CurrencyConversionResponse = z.infer<typeof currencyConversionResponseSchema>;

// Exchange rate schema (for storing historical rates)
export const exchangeRateSchema = z.object({
  id: z.number(),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema,
  rate: z.number(),
  date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

// Input schema for storing exchange rates
export const createExchangeRateInputSchema = z.object({
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema,
  rate: z.number().positive(),
  date: z.coerce.date()
});

export type CreateExchangeRateInput = z.infer<typeof createExchangeRateInputSchema>;

// Schema for getting available currencies
export const currencyInfoSchema = z.object({
  code: currencyCodeSchema,
  name: z.string(),
  symbol: z.string()
});

export type CurrencyInfo = z.infer<typeof currencyInfoSchema>;
