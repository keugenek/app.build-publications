import { z } from 'zod';

// Currency code schema - using ISO 4217 currency codes
export const currencyCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/, {
  message: "Currency code must be 3 uppercase letters"
});

// Input schema for currency conversion request
export const currencyConversionInputSchema = z.object({
  amount: z.number().positive({ message: "Amount must be positive" }),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema
}).refine(
  (data) => data.from_currency !== data.to_currency,
  {
    message: "Source and target currencies must be different",
    path: ["to_currency"]
  }
);

export type CurrencyConversionInput = z.infer<typeof currencyConversionInputSchema>;

// Output schema for currency conversion result
export const currencyConversionResultSchema = z.object({
  id: z.number(),
  amount: z.number(),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema,
  exchange_rate: z.number().positive(),
  converted_amount: z.number(),
  conversion_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type CurrencyConversionResult = z.infer<typeof currencyConversionResultSchema>;

// Schema for exchange rate data from external API
export const exchangeRateSchema = z.object({
  date: z.string(),
  base: currencyCodeSchema,
  rates: z.record(currencyCodeSchema, z.number())
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

// Schema for getting conversion history (optional feature)
export const getConversionHistoryInputSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetConversionHistoryInput = z.infer<typeof getConversionHistoryInputSchema>;

// Schema for supported currencies response
export const supportedCurrenciesSchema = z.array(
  z.object({
    code: currencyCodeSchema,
    name: z.string()
  })
);

export type SupportedCurrencies = z.infer<typeof supportedCurrenciesSchema>;
