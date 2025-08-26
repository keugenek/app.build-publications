import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const createBarang = async (input: CreateBarangInput): Promise<Barang> => {
  try {
    // Check if kode (code) already exists to ensure uniqueness
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode, input.kode))
      .limit(1)
      .execute();

    if (existingBarang.length > 0) {
      throw new Error(`Barang dengan kode '${input.kode}' sudah ada`);
    }

    // Insert new barang record
    const result = await db.insert(barangTable)
      .values({
        nama: input.nama,
        kode: input.kode,
        jumlah_stok: input.jumlah_stok,
        deskripsi: input.deskripsi
        // created_at and updated_at will be set automatically by database defaults
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Barang creation failed:', error);
    throw error;
  }
};
