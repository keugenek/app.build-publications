import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiKeluarInput, type TransaksiWithBarang } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaksiKeluar(input: CreateTransaksiKeluarInput): Promise<TransaksiWithBarang> {
  try {
    // First, check if barang exists and has sufficient stock
    const barang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    if (barang.length === 0) {
      throw new Error(`Barang dengan ID ${input.barang_id} tidak ditemukan`);
    }

    const currentBarang = barang[0];
    if (currentBarang.stok < input.jumlah) {
      throw new Error(`Stok tidak mencukupi. Stok tersedia: ${currentBarang.stok}, diminta: ${input.jumlah}`);
    }

    // Create the transaction record
    const transaksiResult = await db.insert(transaksiTable)
      .values({
        tanggal: input.tanggal,
        barang_id: input.barang_id,
        jenis: 'KELUAR',
        jumlah: input.jumlah,
        keterangan: input.keterangan
      })
      .returning()
      .execute();

    const newTransaksi = transaksiResult[0];

    // Update the barang stock (decrease)
    const updatedStok = currentBarang.stok - input.jumlah;
    await db.update(barangTable)
      .set({
        stok: updatedStok,
        updated_at: new Date()
      })
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    // Get updated barang data
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    const finalBarang = updatedBarang[0];

    // Return the transaction with barang information
    return {
      id: newTransaksi.id,
      tanggal: newTransaksi.tanggal,
      barang_id: newTransaksi.barang_id,
      jenis: newTransaksi.jenis,
      jumlah: newTransaksi.jumlah,
      keterangan: newTransaksi.keterangan,
      created_at: newTransaksi.created_at,
      updated_at: newTransaksi.updated_at,
      barang: {
        id: finalBarang.id,
        nama: finalBarang.nama,
        kode_barang: finalBarang.kode_barang,
        deskripsi: finalBarang.deskripsi,
        harga: parseFloat(finalBarang.harga), // Convert numeric to number
        stok: finalBarang.stok,
        created_at: finalBarang.created_at,
        updated_at: finalBarang.updated_at
      }
    };
  } catch (error) {
    console.error('Transaksi keluar creation failed:', error);
    throw error;
  }
}
