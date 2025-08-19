import { db } from '../db';
import { barangTable } from '../db/schema';
import { type UpdateBarangInput, type Barang } from '../schema';
import { eq, and, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function updateBarang(input: UpdateBarangInput): Promise<Barang> {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with ID ${input.id} not found`);
    }

    // If kode_barang is being updated, check for uniqueness
    if (input.kode_barang) {
      const duplicateKode = await db.select()
        .from(barangTable)
        .where(and(
          eq(barangTable.kode_barang, input.kode_barang),
          ne(barangTable.id, input.id)
        ))
        .execute();

      if (duplicateKode.length > 0) {
        throw new Error(`Kode barang '${input.kode_barang}' already exists`);
      }
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: sql`now()`
    };

    if (input.nama !== undefined) {
      updateData.nama = input.nama;
    }
    if (input.kode_barang !== undefined) {
      updateData.kode_barang = input.kode_barang;
    }
    if (input.deskripsi !== undefined) {
      updateData.deskripsi = input.deskripsi;
    }
    if (input.harga !== undefined) {
      updateData.harga = input.harga.toString(); // Convert number to string for numeric column
    }
    if (input.stok !== undefined) {
      updateData.stok = input.stok;
    }

    // Update the barang
    const result = await db.update(barangTable)
      .set(updateData)
      .where(eq(barangTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedBarang = result[0];
    return {
      ...updatedBarang,
      harga: parseFloat(updatedBarang.harga) // Convert string back to number
    };
  } catch (error) {
    console.error('Barang update failed:', error);
    throw error;
  }
}
