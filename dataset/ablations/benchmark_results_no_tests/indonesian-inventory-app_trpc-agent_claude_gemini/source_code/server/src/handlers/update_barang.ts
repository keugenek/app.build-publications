import { db } from '../db';
import { barangTable } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { type UpdateBarangInput, type Barang } from '../schema';

export async function updateBarang(input: UpdateBarangInput): Promise<Barang> {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang dengan ID ${input.id} tidak ditemukan`);
    }

    // If kode is being updated, check for uniqueness
    if (input.kode !== undefined) {
      const duplicateKode = await db.select()
        .from(barangTable)
        .where(
          and(
            eq(barangTable.kode, input.kode),
            ne(barangTable.id, input.id)
          )
        )
        .execute();

      if (duplicateKode.length > 0) {
        throw new Error(`Kode barang '${input.kode}' sudah digunakan oleh barang lain`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.nama !== undefined) {
      updateData.nama = input.nama;
    }
    if (input.kode !== undefined) {
      updateData.kode = input.kode;
    }
    if (input.jumlah_stok !== undefined) {
      updateData.jumlah_stok = input.jumlah_stok;
    }
    if (input.deskripsi !== undefined) {
      updateData.deskripsi = input.deskripsi;
    }

    // Update the barang
    const result = await db.update(barangTable)
      .set(updateData)
      .where(eq(barangTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Barang update failed:', error);
    throw error;
  }
}
