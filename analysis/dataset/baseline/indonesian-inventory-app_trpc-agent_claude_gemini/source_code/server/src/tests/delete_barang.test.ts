import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput, type CreateBarangInput } from '../schema';
import { deleteBarang } from '../handlers/delete_barang';
import { eq } from 'drizzle-orm';

// Test input for creating barang
const testBarangInput: CreateBarangInput = {
  nama: 'Test Barang',
  kode_barang: 'TB001',
  deskripsi: 'Barang untuk testing',
  harga: 50000,
  stok: 10
};

// Helper function to create test barang
async function createTestBarang(): Promise<number> {
  const result = await db.insert(barangTable)
    .values({
      nama: testBarangInput.nama,
      kode_barang: testBarangInput.kode_barang,
      deskripsi: testBarangInput.deskripsi,
      harga: testBarangInput.harga.toString(),
      stok: testBarangInput.stok
    })
    .returning()
    .execute();
  
  return result[0].id;
}

// Helper function to create test transaction
async function createTestTransaction(barangId: number): Promise<void> {
  await db.insert(transaksiTable)
    .values({
      tanggal: new Date(),
      barang_id: barangId,
      jenis: 'MASUK',
      jumlah: 5,
      keterangan: 'Test transaction'
    })
    .execute();
}

describe('deleteBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a barang without transactions', async () => {
    // Create test barang
    const barangId = await createTestBarang();

    const deleteInput: DeleteBarangInput = { id: barangId };

    // Delete the barang
    const result = await deleteBarang(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify barang is deleted from database
    const deletedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(deletedBarang).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent barang', async () => {
    const deleteInput: DeleteBarangInput = { id: 999 };

    // Should throw error for non-existent barang
    await expect(deleteBarang(deleteInput))
      .rejects
      .toThrow(/Barang dengan ID 999 tidak ditemukan/i);
  });

  it('should throw error when barang has related transactions', async () => {
    // Create test barang
    const barangId = await createTestBarang();

    // Create a transaction for this barang
    await createTestTransaction(barangId);

    const deleteInput: DeleteBarangInput = { id: barangId };

    // Should throw error because of related transactions
    await expect(deleteBarang(deleteInput))
      .rejects
      .toThrow(/Tidak dapat menghapus barang karena masih memiliki.*transaksi terkait/i);

    // Verify barang still exists in database
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(existingBarang).toHaveLength(1);
    expect(existingBarang[0].nama).toEqual('Test Barang');
  });

  it('should throw error when barang has multiple related transactions', async () => {
    // Create test barang
    const barangId = await createTestBarang();

    // Create multiple transactions
    await createTestTransaction(barangId);
    await db.insert(transaksiTable)
      .values({
        tanggal: new Date(),
        barang_id: barangId,
        jenis: 'KELUAR',
        jumlah: 3,
        keterangan: 'Second test transaction'
      })
      .execute();

    const deleteInput: DeleteBarangInput = { id: barangId };

    // Should throw error mentioning multiple transactions
    await expect(deleteBarang(deleteInput))
      .rejects
      .toThrow(/Tidak dapat menghapus barang karena masih memiliki 2 transaksi terkait/i);
  });

  it('should handle database constraints properly', async () => {
    // Create test barang
    const barangId = await createTestBarang();

    // Verify barang exists before deletion
    const beforeDeletion = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    const deleteInput: DeleteBarangInput = { id: barangId };

    // Delete should succeed
    const result = await deleteBarang(deleteInput);
    expect(result.success).toBe(true);

    // Verify complete removal
    const afterDeletion = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});
