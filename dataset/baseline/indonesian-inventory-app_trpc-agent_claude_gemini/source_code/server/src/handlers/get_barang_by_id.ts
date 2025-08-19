import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangByIdInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const getBarangById = async (input: GetBarangByIdInput): Promise<Barang | null> => {
  try {
    // Query for the barang by ID
    const results = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    // Return null if not found
    if (results.length === 0) {
      return null;
    }

    const barang = results[0];
    
    // Convert numeric field back to number and return
    return {
      ...barang,
      harga: parseFloat(barang.harga) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to get barang by ID:', error);
    throw error;
  }
};
