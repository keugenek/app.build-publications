import { db } from '../db';
import { transaksiTable, barangTable } from '../db/schema';
import { type Transaksi, type TransaksiWithBarang } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getTransaksi = async (): Promise<TransaksiWithBarang[]> => {
  try {
    const results = await db.select()
      .from(transaksiTable)
      .innerJoin(barangTable, eq(transaksiTable.barang_id, barangTable.id))
      .orderBy(desc(transaksiTable.tanggal_transaksi))
      .execute();

    return results.map(result => ({
      // Transaction data
      id: result.transaksi.id,
      tanggal_transaksi: result.transaksi.tanggal_transaksi,
      jenis_transaksi: result.transaksi.jenis_transaksi,
      barang_id: result.transaksi.barang_id,
      jumlah: result.transaksi.jumlah,
      catatan: result.transaksi.catatan,
      created_at: result.transaksi.created_at,
      updated_at: result.transaksi.updated_at,
      // Related barang data with numeric conversions
      barang: {
        id: result.barang.id,
        nama_barang: result.barang.nama_barang,
        kode_barang: result.barang.kode_barang,
        deskripsi: result.barang.deskripsi,
        jumlah_stok: result.barang.jumlah_stok,
        harga_beli: result.barang.harga_beli ? parseFloat(result.barang.harga_beli) : null,
        harga_jual: result.barang.harga_jual ? parseFloat(result.barang.harga_jual) : null,
        created_at: result.barang.created_at,
        updated_at: result.barang.updated_at
      }
    }));
  } catch (error) {
    console.error('Get transaksi failed:', error);
    throw error;
  }
};

export const getTransaksiByBarangId = async (barangId: number): Promise<Transaksi[]> => {
  try {
    const results = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, barangId))
      .orderBy(desc(transaksiTable.tanggal_transaksi))
      .execute();

    return results;
  } catch (error) {
    console.error('Get transaksi by barang ID failed:', error);
    throw error;
  }
};
