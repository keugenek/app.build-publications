import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteBarang(input: DeleteBarangInput): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the barang exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    if (existingBarang.length === 0) {
      return {
        success: false,
        message: "Barang tidak ditemukan"
      };
    }

    // Check if there are any related transaksi records
    const relatedTransaksi = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, input.id))
      .execute();

    // Prevent deletion if there are transaction records
    if (relatedTransaksi.length > 0) {
      return {
        success: false,
        message: `Tidak dapat menghapus barang karena masih memiliki ${relatedTransaksi.length} transaksi terkait`
      };
    }

    // Delete the barang if no related transactions exist
    await db.delete(barangTable)
      .where(eq(barangTable.id, input.id))
      .execute();

    return {
      success: true,
      message: "Barang berhasil dihapus"
    };
  } catch (error) {
    console.error('Barang deletion failed:', error);
    throw error;
  }
}
