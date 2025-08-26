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

    // If kode_sku is being updated, check for uniqueness
    if (input.kode_sku) {
      const duplicateSku = await db.select()
        .from(barangTable)
        .where(and(
          eq(barangTable.kode_sku, input.kode_sku),
          ne(barangTable.id, input.id)
        ))
        .execute();

      if (duplicateSku.length > 0) {
        throw new Error(`Barang with kode_sku '${input.kode_sku}' already exists`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.nama_barang !== undefined) {
      updateData.nama_barang = input.nama_barang;
    }

    if (input.kode_sku !== undefined) {
      updateData.kode_sku = input.kode_sku;
    }

    if (input.jumlah_stok !== undefined) {
      updateData.jumlah_stok = input.jumlah_stok;
    }

    // Update the barang record
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
};
