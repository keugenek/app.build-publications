import { db } from '../db';
import { transaksiTable, barangTable } from '../db/schema';
import { type TransaksiWithBarang } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTransaksi(): Promise<TransaksiWithBarang[]> {
  try {
    // Query all transactions with their related barang information
    // Order by tanggal descending to show newest transactions first
    const results = await db.select()
      .from(transaksiTable)
      .innerJoin(barangTable, eq(transaksiTable.barang_id, barangTable.id))
      .orderBy(desc(transaksiTable.tanggal))
      .execute();

    // Transform the joined results to match TransaksiWithBarang schema
    return results.map(result => ({
      id: result.transaksi.id,
      tanggal: result.transaksi.tanggal,
      barang_id: result.transaksi.barang_id,
      jenis: result.transaksi.jenis,
      jumlah: result.transaksi.jumlah,
      keterangan: result.transaksi.keterangan,
      created_at: result.transaksi.created_at,
      updated_at: result.transaksi.updated_at,
      barang: {
        id: result.barang.id,
        nama: result.barang.nama,
        kode_barang: result.barang.kode_barang,
        deskripsi: result.barang.deskripsi,
        harga: parseFloat(result.barang.harga), // Convert numeric field to number
        stok: result.barang.stok,
        created_at: result.barang.created_at,
        updated_at: result.barang.updated_at
      }
    }));
  } catch (error) {
    console.error('Failed to fetch transaksi:', error);
    throw error;
  }
}
