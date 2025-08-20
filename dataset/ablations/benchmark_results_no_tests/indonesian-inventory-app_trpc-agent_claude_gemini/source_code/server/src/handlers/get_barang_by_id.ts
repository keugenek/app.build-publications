import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangByIdInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBarangById(input: GetBarangByIdInput): Promise<Barang | null> {
  try {
    // Query barang by ID
    const results = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    // Return null if no barang found
    if (results.length === 0) {
      return null;
    }

    // Return the barang record
    const barang = results[0];
    return {
      id: barang.id,
      nama: barang.nama,
      kode: barang.kode,
      jumlah_stok: barang.jumlah_stok,
      deskripsi: barang.deskripsi,
      created_at: barang.created_at,
      updated_at: barang.updated_at
    };
  } catch (error) {
    console.error('Failed to get barang by ID:', error);
    throw error;
  }
}
