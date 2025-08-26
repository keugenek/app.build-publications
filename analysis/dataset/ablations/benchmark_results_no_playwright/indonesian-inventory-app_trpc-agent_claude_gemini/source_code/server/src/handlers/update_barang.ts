import { db } from '../db';
import { barangTable } from '../db/schema';
import { type UpdateBarangInput, type Barang } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateBarang = async (input: UpdateBarangInput): Promise<Barang> => {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with id ${input.id} not found`);
    }

    // Check for kode_barang uniqueness if it's being updated
    if (input.kode_barang) {
      const duplicateBarang = await db.select()
        .from(barangTable)
        .where(
          and(
            eq(barangTable.kode_barang, input.kode_barang),
            ne(barangTable.id, input.id)
          )
        )
        .execute();

      if (duplicateBarang.length > 0) {
        throw new Error(`Barang with kode_barang '${input.kode_barang}' already exists`);
      }
    }

    // Build update values - only include fields that are provided
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.nama_barang !== undefined) {
      updateValues.nama_barang = input.nama_barang;
    }
    if (input.kode_barang !== undefined) {
      updateValues.kode_barang = input.kode_barang;
    }
    if (input.deskripsi !== undefined) {
      updateValues.deskripsi = input.deskripsi;
    }
    if (input.harga_beli !== undefined) {
      updateValues.harga_beli = input.harga_beli ? input.harga_beli.toString() : null;
    }
    if (input.harga_jual !== undefined) {
      updateValues.harga_jual = input.harga_jual ? input.harga_jual.toString() : null;
    }

    // Update the barang record
    const result = await db.update(barangTable)
      .set(updateValues)
      .where(eq(barangTable.id, input.id))
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
    console.error('Barang update failed:', error);
    throw error;
  }
};
