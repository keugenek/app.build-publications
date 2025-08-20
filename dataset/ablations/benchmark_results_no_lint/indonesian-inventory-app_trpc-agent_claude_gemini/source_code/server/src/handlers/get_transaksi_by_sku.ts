import { db } from '../db';
import { transaksiTable } from '../db/schema';
import { type GetTransaksiBySkuInput, type Transaksi } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTransaksiBySku(input: GetTransaksiBySkuInput): Promise<Transaksi[]> {
  try {
    // Query transactions by SKU code, ordered by date descending (newest first)
    const results = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.kode_sku, input.kode_sku))
      .orderBy(desc(transaksiTable.tanggal_transaksi))
      .execute();

    // Return the results directly as they already match the Transaksi type
    return results;
  } catch (error) {
    console.error('Failed to get transaksi by SKU:', error);
    throw error;
  }
}
