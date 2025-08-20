import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const createBarang = async (input: CreateBarangInput): Promise<Barang> => {
  try {
    // Check if kode_barang already exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_barang, input.kode_barang))
      .execute();

    if (existingBarang.length > 0) {
      throw new Error(`Barang with kode_barang '${input.kode_barang}' already exists`);
    }

    // Insert new barang record
    const result = await db.insert(barangTable)
      .values({
        nama_barang: input.nama_barang,
        kode_barang: input.kode_barang,
        deskripsi: input.deskripsi || null,
        jumlah_stok: 0, // Initial stock is always 0
        harga_beli: input.harga_beli ? input.harga_beli.toString() : null,
        harga_jual: input.harga_jual ? input.harga_jual.toString() : null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const barang = result[0];
    return {
      ...barang,
      harga_beli: barang.harga_beli ? parseFloat(barang.harga_beli) : null,
      harga_jual: barang.harga_jual ? parseFloat(barang.harga_jual) : null
    };
  } catch (error) {
    console.error('Barang creation failed:', error);
    throw error;
  }
};
