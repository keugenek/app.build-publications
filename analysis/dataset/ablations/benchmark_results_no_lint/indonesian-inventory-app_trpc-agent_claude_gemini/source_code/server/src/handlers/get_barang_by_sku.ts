import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangBySkuInput, type Barang } from '../schema';
import { eq } from 'drizzle-orm';

export const getBarangBySku = async (input: GetBarangBySkuInput): Promise<Barang | null> => {
  try {
    const results = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Return the first result as Barang type
    const barang = results[0];
    return {
      id: barang.id,
      nama_barang: barang.nama_barang,
      kode_sku: barang.kode_sku,
      jumlah_stok: barang.jumlah_stok,
      created_at: barang.created_at,
      updated_at: barang.updated_at
    };
  } catch (error) {
    console.error('Get barang by SKU failed:', error);
    throw error;
  }
};
