import { db } from '../db';
import { barangTable } from '../db/schema';
import { type Barang } from '../schema';

export const getAllBarang = async (): Promise<Barang[]> => {
  try {
    // Fetch all barang from the database
    const results = await db.select()
      .from(barangTable)
      .execute();

    // Return the results - no numeric field conversions needed for this table
    return results;
  } catch (error) {
    console.error('Get all barang failed:', error);
    throw error;
  }
};
