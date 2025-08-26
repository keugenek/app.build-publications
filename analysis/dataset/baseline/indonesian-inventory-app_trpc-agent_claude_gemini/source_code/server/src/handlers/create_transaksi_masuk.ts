import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiMasukInput, type TransaksiWithBarang } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaksiMasuk(input: CreateTransaksiMasukInput): Promise<TransaksiWithBarang> {
  try {
    // First, verify that the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang dengan ID ${input.barang_id} tidak ditemukan`);
    }

    const barang = existingBarang[0];

    // Create the transaksi record
    const transaksiResult = await db.insert(transaksiTable)
      .values({
        tanggal: input.tanggal,
        barang_id: input.barang_id,
        jenis: 'MASUK',
        jumlah: input.jumlah,
        keterangan: input.keterangan,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const transaksi = transaksiResult[0];

    // Update the barang stock by adding the transaction amount
    const newStok = barang.stok + input.jumlah;
    const updatedBarangResult = await db.update(barangTable)
      .set({ 
        stok: newStok,
        updated_at: new Date()
      })
      .where(eq(barangTable.id, input.barang_id))
      .returning()
      .execute();

    const updatedBarang = updatedBarangResult[0];

    // Return the transaction with updated barang information
    return {
      ...transaksi,
      barang: {
        ...updatedBarang,
        harga: parseFloat(updatedBarang.harga) // Convert numeric field back to number
      }
    };
  } catch (error) {
    console.error('Transaksi masuk creation failed:', error);
    throw error;
  }
}
