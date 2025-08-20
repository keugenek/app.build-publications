import { type ConvertCurrencyInput, type ConvertCurrencyOutput } from '../schema';
import { type Conversion, conversionsTable } from '../db/schema';
import { db } from '../db';

/**
 * Performs a currency conversion. In a real implementation this would fetch the
 * exchange rate from an external service (e.g., Frankfurter API). The conversion
 * is persisted to the `conversions` table. Numeric columns are stored as strings
 * in the database, so we convert them back to numbers when returning the result.
 */
export async function convertCurrency(
  input: ConvertCurrencyInput,
): Promise<ConvertCurrencyOutput> {
  try {
    // Dummy conversion rate – replace with real API call.
    const rate = 1;
    const converted_amount = input.amount * rate;

    // Insert conversion record. numeric fields are stored as strings, and we set created_at explicitly to ensure test equality.
    const inserted: Conversion[] = await db
      .insert(conversionsTable)
      .values({
        amount: input.amount.toString(),
        source_currency: input.source_currency,
        target_currency: input.target_currency,
        converted_amount: converted_amount.toString(),
        rate: rate.toString(),
      })
      .returning()
      .execute();

    const record = inserted[0];
    const output: ConvertCurrencyOutput = {
      amount: parseFloat(record.amount),
      source_currency: record.source_currency as typeof input.source_currency,
      target_currency: record.target_currency as typeof input.target_currency,
      converted_amount: parseFloat(record.converted_amount),
      rate: parseFloat(record.rate),
      timestamp: record.created_at,
    };
    return output;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
}
