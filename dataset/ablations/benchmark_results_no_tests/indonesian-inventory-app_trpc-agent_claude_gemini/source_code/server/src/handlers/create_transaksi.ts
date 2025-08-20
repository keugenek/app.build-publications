import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiInput, type Transaksi } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaksi = async (input: CreateTransaksiInput): Promise<Transaksi> => {
  try {
    // 1. Validate that the barang exists and get its current data
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    if (existingBarang.length === 0) {
      throw new Error(`Barang with ID ${input.barang_id} not found`);
    }

    const barang = existingBarang[0];
    
    // 2. Calculate new stock quantity based on transaction type
    let newStockQuantity: number;
    if (input.jenis === 'masuk') {
      newStockQuantity = barang.jumlah_stok + input.jumlah;
    } else { // 'keluar'
      // 3. For 'keluar' transactions, ensure sufficient stock is available
      if (barang.jumlah_stok < input.jumlah) {
        throw new Error(`Insufficient stock. Available: ${barang.jumlah_stok}, Required: ${input.jumlah}`);
      }
      newStockQuantity = barang.jumlah_stok - input.jumlah;
    }

    // 4. Create the transaction record with denormalized nama_barang
    const transactionResult = await db.insert(transaksiTable)
      .values({
        jenis: input.jenis,
        barang_id: input.barang_id,
        nama_barang: barang.nama, // Store nama_barang for denormalization
        jumlah: input.jumlah,
        tanggal_transaksi: input.tanggal_transaksi
      })
      .returning()
      .execute();

    // 5. Update the barang's stock quantity
    await db.update(barangTable)
      .set({ 
        jumlah_stok: newStockQuantity,
        updated_at: new Date()
      })
      .where(eq(barangTable.id, input.barang_id))
      .execute();

    return transactionResult[0];
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
