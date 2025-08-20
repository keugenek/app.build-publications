import { db } from '../db';
import { transaksiTable } from '../db/schema';
import { type GetTransaksiByBarangIdInput, type Transaksi } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getTransaksiByBarangId = async (input: GetTransaksiByBarangIdInput): Promise<Transaksi[]> => {
  try {
    // Query transactions for the specified barang ID, ordered by tanggal_transaksi descending
    const results = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, input.barang_id))
      .orderBy(desc(transaksiTable.tanggal_transaksi))
      .execute();

    // Return the results - no numeric conversions needed as all fields are integers or dates
    return results;
  } catch (error) {
    console.error('Failed to get transaksi by barang ID:', error);
    throw error;
  }
};
