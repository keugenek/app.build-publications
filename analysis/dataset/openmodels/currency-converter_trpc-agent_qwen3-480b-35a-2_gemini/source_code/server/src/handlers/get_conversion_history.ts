import { type ConversionResult } from '../schema';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getConversionHistory = async (): Promise<ConversionResult[]> => {
  try {
    // Fetch conversion history from database, ordered by creation date
    const history = await db
      .select()
      .from(conversionsTable)
      .orderBy(desc(conversionsTable.created_at))
      .limit(10); // Limit to last 10 conversions
    
    // Transform to match our schema
    return history.map(item => ({
      amount: parseFloat(item.amount),
      convertedAmount: parseFloat(item.converted_amount),
      from: item.from_currency,
      to: item.to_currency,
      rate: parseFloat(item.rate),
      timestamp: item.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching conversion history:', error);
    throw new Error('Failed to fetch conversion history');
  }
};
