import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function deleteBarang(input: DeleteBarangInput): Promise<{ success: boolean }> {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang dengan ID ${input.id} tidak ditemukan`);
    }

    // Check if there are any related transactions
    const transactionCount = await db.select({ count: count() })
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, input.id))
      .execute();

    if (transactionCount[0].count > 0) {
      throw new Error(`Tidak dapat menghapus barang karena masih memiliki ${transactionCount[0].count} transaksi terkait`);
    }

    // Delete the barang
    await db.delete(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Penghapusan barang gagal:', error);
    throw error;
  }
}
