import { db } from '../db';
import { barangTable } from '../db/schema';
import { type Barang } from '../schema';
import { desc } from 'drizzle-orm';

export async function getBarang(): Promise<Barang[]> {
  try {
    const results = await db.select()
      .from(barangTable)
      .orderBy(desc(barangTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(barang => ({
      ...barang,
      harga: parseFloat(barang.harga) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get barang failed:', error);
    throw error;
  }
}
