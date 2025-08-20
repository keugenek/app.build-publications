import { db } from '../db';
import { currenciesTable } from '../db/schema';
import { type Currency } from '../schema';

export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    // Query all currencies from the database
    const results = await db.select()
      .from(currenciesTable)
      .execute();
    
    // Return the currency records as-is since they match the schema
    return results;
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    throw error;
  }
};
