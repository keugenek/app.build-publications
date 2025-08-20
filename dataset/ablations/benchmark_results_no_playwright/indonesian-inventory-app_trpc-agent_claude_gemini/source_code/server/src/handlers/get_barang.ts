import { db } from '../db';
import { barangTable } from '../db/schema';
import { type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const getBarang = async (): Promise<Barang[]> => {
  try {
    const results = await db.select()
      .from(barangTable)
      .execute();

    // Convert numeric fields back to numbers for all items
    return results.map(barang => ({
      ...barang,
      harga_beli: barang.harga_beli ? parseFloat(barang.harga_beli) : null,
      harga_jual: barang.harga_jual ? parseFloat(barang.harga_jual) : null
    }));
  } catch (error) {
    console.error('Failed to fetch barang:', error);
    throw error;
  }
};

export const getBarangById = async (id: number): Promise<Barang | null> => {
  try {
    const results = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const barang = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...barang,
      harga_beli: barang.harga_beli ? parseFloat(barang.harga_beli) : null,
      harga_jual: barang.harga_jual ? parseFloat(barang.harga_jual) : null
    };
  } catch (error) {
    console.error('Failed to fetch barang by ID:', error);
    throw error;
  }
};
