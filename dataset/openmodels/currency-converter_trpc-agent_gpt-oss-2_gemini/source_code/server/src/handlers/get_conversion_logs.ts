import type { ConversionLog } from '../schema';
import { db } from '../db';
import { conversionLogs } from '../db/schema';

/**
 * List all conversion logs from the database.
 * Numeric fields are stored as strings in PostgreSQL via Drizzle's numeric type,
 * so they are converted back to numbers before returning.
 */
export const listConversionLogs = async (): Promise<ConversionLog[]> => {
  // Fetch raw rows from the conversion_logs table
  const rows = await db.select().from(conversionLogs).execute();

  // Map to the shape defined by ConversionLog schema, converting numeric strings to numbers
  return rows.map((row) => ({
    id: row.id,
    amount: parseFloat(row.amount),
    from: row.from,
    to: row.to,
    convertedAmount: parseFloat(row.converted_amount),
    rate: parseFloat(row.rate),
    createdAt: row.created_at,
  }));
};
