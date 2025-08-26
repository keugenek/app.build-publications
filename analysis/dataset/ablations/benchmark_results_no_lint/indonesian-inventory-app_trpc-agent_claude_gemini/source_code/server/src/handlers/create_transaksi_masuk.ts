import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiMasukInput, type Transaksi } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaksiMasuk(input: CreateTransaksiMasukInput): Promise<Transaksi> {
  try {
    // 1. Validate that the barang with kode_sku exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with SKU ${input.kode_sku} not found`);
    }

    const barang = existingBarang[0];

    // 2. Create the transaction record with jenis_transaksi = 'masuk'
    const transactionResult = await db.insert(transaksiTable)
      .values({
        kode_sku: input.kode_sku,
        jenis_transaksi: 'masuk',
        jumlah: input.jumlah,
        tanggal_transaksi: input.tanggal_transaksi
      })
      .returning()
      .execute();

    // 3. Update the jumlah_stok of the related barang by adding the transaction amount
    // 4. Update the updated_at timestamp of the barang
    await db.update(barangTable)
      .set({
        jumlah_stok: barang.jumlah_stok + input.jumlah,
        updated_at: new Date()
      })
      .where(eq(barangTable.kode_sku, input.kode_sku))
      .execute();

    return transactionResult[0];
  } catch (error) {
    console.error('Transaksi masuk creation failed:', error);
    throw error;
  }
}
