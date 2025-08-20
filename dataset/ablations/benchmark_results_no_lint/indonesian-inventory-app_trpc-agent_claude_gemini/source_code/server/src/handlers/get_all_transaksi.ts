import { db } from '../db';
import { transaksiTable } from '../db/schema';
import { type Transaksi } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllTransaksi = async (): Promise<Transaksi[]> => {
  try {
    // Fetch all transactions ordered by tanggal_transaksi descending (newest first)
    const results = await db.select()
      .from(transaksiTable)
      .orderBy(desc(transaksiTable.tanggal_transaksi))
      .execute();

    // Return the results - no numeric conversions needed as all fields are integers or text
    return results;
  } catch (error) {
    console.error('Failed to fetch all transaksi:', error);
    throw error;
  }
};
