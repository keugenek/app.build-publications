import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { eq, count } from 'drizzle-orm';

export const deleteBarang = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with id ${id} not found`);
    }

    // Check if there are any related transactions
    const relatedTransactions = await db.select({ count: count() })
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, id))
      .execute();

    if (relatedTransactions[0].count > 0) {
      throw new Error(`Cannot delete barang with id ${id} because it has related transactions`);
    }

    // Delete the barang
    const result = await db.delete(barangTable)
      .where(eq(barangTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Barang deletion failed:', error);
    throw error;
  }
};
