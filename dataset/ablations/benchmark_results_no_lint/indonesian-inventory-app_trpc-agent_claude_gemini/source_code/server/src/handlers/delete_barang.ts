import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteBarang(input: DeleteBarangInput): Promise<{ success: boolean }> {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with ID ${input.id} not found`);
    }

    const barang = existingBarang[0];

    // Check if there are any related transactions
    const relatedTransactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.kode_sku, barang.kode_sku))
      .execute();

    if (relatedTransactions.length > 0) {
      throw new Error(`Cannot delete barang with SKU ${barang.kode_sku} - it has related transactions`);
    }

    // Delete the barang
    await db.delete(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Delete barang failed:', error);
    throw error;
  }
}
