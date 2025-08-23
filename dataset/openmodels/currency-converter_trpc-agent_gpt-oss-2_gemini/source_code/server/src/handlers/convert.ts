import type { ConvertInput, ConvertOutput } from '../schema';
import { db } from '../db';
import { conversionLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Conversion handler.
 * Uses a dummy exchange rate, calculates the converted amount, and persists a conversion log.
 * Numeric fields are stored as strings (PostgreSQL numeric) and converted back to numbers on read.
 */
export const convert = async (input: ConvertInput): Promise<ConvertOutput> => {
  try {
    // Dummy exchange rate – in a real case fetch from external API
    const dummyRate = 1.23;
    const convertedAmount = input.amount * dummyRate;

    // Insert conversion log – numeric columns must be strings when inserted
    await db
      .insert(conversionLogs)
      .values({
        amount: input.amount.toString(),
        from: input.from,
        to: input.to,
        converted_amount: convertedAmount.toString(),
        rate: dummyRate.toString(),
      })
      .execute();

    return {
      amount: input.amount,
      from: input.from,
      to: input.to,
      convertedAmount,
      rate: dummyRate,
    };
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
};
