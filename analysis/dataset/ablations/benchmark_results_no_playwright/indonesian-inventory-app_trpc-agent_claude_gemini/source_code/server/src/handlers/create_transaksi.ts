import { db } from '../db';
import { transaksiTable, barangTable } from '../db/schema';
import { type CreateTransaksiInput, type Transaksi } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaksi = async (input: CreateTransaksiInput): Promise<Transaksi> => {
  try {
    // First, verify that the barang exists and get current stock
    const barangResults = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    if (barangResults.length === 0) {
      throw new Error(`Barang with ID ${input.barang_id} not found`);
    }

    const barang = barangResults[0];
    let newStok: number;

    // Calculate new stock based on transaction type
    if (input.jenis_transaksi === 'Masuk') {
      newStok = barang.jumlah_stok + input.jumlah;
    } else if (input.jenis_transaksi === 'Keluar') {
      // Validate sufficient stock for 'Keluar' transactions
      if (barang.jumlah_stok < input.jumlah) {
        throw new Error(`Insufficient stock. Available: ${barang.jumlah_stok}, Required: ${input.jumlah}`);
      }
      newStok = barang.jumlah_stok - input.jumlah;
    } else {
      throw new Error(`Invalid transaction type: ${input.jenis_transaksi}`);
    }

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create the transaction record
      const transaksiResult = await tx.insert(transaksiTable)
        .values({
          tanggal_transaksi: input.tanggal_transaksi,
          jenis_transaksi: input.jenis_transaksi,
          barang_id: input.barang_id,
          jumlah: input.jumlah,
          catatan: input.catatan || null
        })
        .returning()
        .execute();

      // Update the barang stock and updated_at
      await tx.update(barangTable)
        .set({
          jumlah_stok: newStok,
          updated_at: new Date()
        })
        .where(eq(barangTable.id, input.barang_id))
        .execute();

      return transaksiResult[0];
    });

    return result;
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
