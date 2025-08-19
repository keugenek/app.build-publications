import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export async function createBarang(input: CreateBarangInput): Promise<Barang> {
  try {
    // Check if kode_barang already exists to ensure uniqueness
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_barang, input.kode_barang))
      .execute();

    if (existingBarang.length > 0) {
      throw new Error(`Barang dengan kode '${input.kode_barang}' sudah ada`);
    }

    // Insert new barang record
    const result = await db.insert(barangTable)
      .values({
        nama: input.nama,
        kode_barang: input.kode_barang,
        deskripsi: input.deskripsi,
        harga: input.harga.toString(), // Convert number to string for numeric column
        stok: input.stok || 0 // Apply default if not provided
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const barang = result[0];
    return {
      ...barang,
      harga: parseFloat(barang.harga) // Convert string back to number
    };
  } catch (error) {
    console.error('Barang creation failed:', error);
    throw error;
  }
}
