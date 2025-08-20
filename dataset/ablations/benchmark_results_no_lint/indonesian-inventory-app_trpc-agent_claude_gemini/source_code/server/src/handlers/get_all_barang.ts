import { db } from '../db';
import { barangTable } from '../db/schema';
import { type Barang } from '../schema';

export async function getAllBarang(): Promise<Barang[]> {
  try {
    // Fetch all barang from the database
    const results = await db.select()
      .from(barangTable)
      .execute();

    // Return the results - no numeric conversions needed as all fields are already correct types
    return results;
  } catch (error) {
    console.error('Failed to fetch all barang:', error);
    throw error;
  }
}
