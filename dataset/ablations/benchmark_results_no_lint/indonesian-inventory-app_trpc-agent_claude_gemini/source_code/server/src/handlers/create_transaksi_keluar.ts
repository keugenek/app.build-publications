import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiKeluarInput, type Transaksi } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaksiKeluar(input: CreateTransaksiKeluarInput): Promise<Transaksi> {
  try {
    // 1. Validate that the barang with kode_sku exists and get current stock
    const barangResult = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    if (barangResult.length === 0) {
      throw new Error(`Barang dengan kode SKU ${input.kode_sku} tidak ditemukan`);
    }

    const barang = barangResult[0];

    // 2. Validate that there is sufficient stock
    if (barang.jumlah_stok < input.jumlah) {
      throw new Error(`Stok tidak mencukupi. Stok tersedia: ${barang.jumlah_stok}, diminta: ${input.jumlah}`);
    }

    // 3. Create the transaction record with jenis_transaksi = 'keluar'
    const transaksiResult = await db.insert(transaksiTable)
      .values({
        kode_sku: input.kode_sku,
        jenis_transaksi: 'keluar',
        jumlah: input.jumlah,
        tanggal_transaksi: input.tanggal_transaksi || new Date()
      })
      .returning()
      .execute();

    // 4. Update the jumlah_stok of the related barang by subtracting the transaction amount
    // 5. Update the updated_at timestamp of the barang
    await db.update(barangTable)
      .set({
        jumlah_stok: barang.jumlah_stok - input.jumlah,
        updated_at: new Date()
      })
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    return transaksiResult[0];
  } catch (error) {
    console.error('Transaksi keluar creation failed:', error);
    throw error;
  }
}
