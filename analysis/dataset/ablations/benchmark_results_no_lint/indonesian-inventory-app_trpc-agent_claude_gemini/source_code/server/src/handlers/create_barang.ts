import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const createBarang = async (input: CreateBarangInput): Promise<Barang> => {
  try {
    // Check if kode_sku already exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    if (existingBarang.length > 0) {
      throw new Error(`Kode SKU '${input.kode_sku}' sudah ada`);
    }

    // Insert new barang record
    const result = await db.insert(barangTable)
      .values({
        nama_barang: input.nama_barang,
        kode_sku: input.kode_sku,
        jumlah_stok: input.jumlah_stok,
        updated_at: new Date() // Explicitly set updated_at to match created_at timing
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Barang creation failed:', error);
    throw error;
  }
};
