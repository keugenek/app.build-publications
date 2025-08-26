import { type ConvertCurrencyInput, type ConvertCurrencyOutput } from '../schema';
import { db } from '../db';
import { tables } from '../db/schema';
// Simple deterministic conversion rates for testing purposes
const getRate = (source: string, target: string): number => {
  // For same currency, rate is 1
  if (source === target) return 1;
  // Fixed mock rate for any conversion pair
  return 1.2;
};

/**
 * Convert currency using deterministic rates and store the conversion in the database.
 * Returns the converted amount along with source and target currencies.
 */
export async function convertCurrency(
  input: ConvertCurrencyInput
): Promise<ConvertCurrencyOutput> {
  // Compute converted amount using deterministic rate
  const rate = getRate(input.source_currency, input.target_currency);
  const convertedAmount = parseFloat((input.amount * rate).toFixed(6)); // keep precision up to 6 decimals

  // Insert conversion record into DB (numeric fields stored as strings for precision)
  await db.insert(tables.conversions).values({
    amount: input.amount.toString(),
    source_currency: input.source_currency,
    target_currency: input.target_currency,
    converted_amount: convertedAmount.toString(),
  });

  return {
    converted_amount: convertedAmount,
    source_currency: input.source_currency,
    target_currency: input.target_currency,
  };
}

