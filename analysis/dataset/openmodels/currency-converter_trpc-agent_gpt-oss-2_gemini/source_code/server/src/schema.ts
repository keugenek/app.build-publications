import { z } from 'zod';

// Define supported currencies as an enum
export const currencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
]);
export type Currency = z.infer<typeof currencyEnum>;

// Input schema for a conversion request
export const convertInputSchema = z.object({
  amount: z.number().positive(), // Positive amount to convert
  from: currencyEnum,
  to: currencyEnum,
});
export type ConvertInput = z.infer<typeof convertInputSchema>;

// Output schema for a conversion response
export const convertOutputSchema = z.object({
  amount: z.number(), // Original amount
  from: currencyEnum,
  to: currencyEnum,
  convertedAmount: z.number(), // Result after conversion
  rate: z.number(), // Exchange rate used (target per source)
});
export type ConvertOutput = z.infer<typeof convertOutputSchema>;

// Schema for a conversion log stored in the database (output shape)
export const conversionLogSchema = z.object({
  id: z.number(),
  amount: z.number(),
  from: currencyEnum,
  to: currencyEnum,
  convertedAmount: z.number(),
  rate: z.number(),
  createdAt: z.coerce.date(),
});
export type ConversionLog = z.infer<typeof conversionLogSchema>;
