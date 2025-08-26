import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateBarangInput, type CreateTransaksiInput } from '../schema';
import { deleteBarang } from '../handlers/delete_barang';
import { eq } from 'drizzle-orm';

// Test data for barang creation
const testBarangInput: CreateBarangInput = {
  nama_barang: 'Test Item',
  kode_barang: 'TEST001',
  deskripsi: 'A test item',
  harga_beli: 100.00,
  harga_jual: 150.00
};

describe('deleteBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a barang successfully when no related transactions exist', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama_barang: testBarangInput.nama_barang,
        kode_barang: testBarangInput.kode_barang,
        deskripsi: testBarangInput.deskripsi,
        harga_beli: testBarangInput.harga_beli?.toString(),
        harga_jual: testBarangInput.harga_jual?.toString()
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Delete the barang
    const result = await deleteBarang(barangId);
    expect(result.success).toBe(true);

    // Verify barang was deleted from database
    const deletedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(deletedBarang).toHaveLength(0);
  });

  it('should throw error when barang does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteBarang(nonExistentId))
      .rejects.toThrow(/Barang with id 999 not found/i);
  });

  it('should throw error when barang has related transactions', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama_barang: testBarangInput.nama_barang,
        kode_barang: testBarangInput.kode_barang,
        deskripsi: testBarangInput.deskripsi,
        harga_beli: testBarangInput.harga_beli?.toString(),
        harga_jual: testBarangInput.harga_jual?.toString()
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create a transaction related to this barang
    await db.insert(transaksiTable)
      .values({
        tanggal_transaksi: new Date(),
        jenis_transaksi: 'Masuk',
        barang_id: barangId,
        jumlah: 10,
        catatan: 'Test transaction'
      })
      .execute();

    // Try to delete the barang - should fail
    await expect(deleteBarang(barangId))
      .rejects.toThrow(/Cannot delete barang with id .* because it has related transactions/i);

    // Verify barang still exists in database
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(existingBarang).toHaveLength(1);
  });

  it('should handle multiple related transactions correctly', async () => {
    // Create a barang
    const barangResult = await db.insert(barangTable)
      .values({
        nama_barang: testBarangInput.nama_barang,
        kode_barang: testBarangInput.kode_barang,
        deskripsi: testBarangInput.deskripsi,
        harga_beli: testBarangInput.harga_beli?.toString(),
        harga_jual: testBarangInput.harga_jual?.toString()
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create multiple transactions
    await db.insert(transaksiTable)
      .values([
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Masuk',
          barang_id: barangId,
          jumlah: 10,
          catatan: 'First transaction'
        },
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Keluar',
          barang_id: barangId,
          jumlah: 5,
          catatan: 'Second transaction'
        }
      ])
      .execute();

    // Try to delete - should fail
    await expect(deleteBarang(barangId))
      .rejects.toThrow(/Cannot delete barang with id .* because it has related transactions/i);

    // Verify barang still exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(existingBarang).toHaveLength(1);
  });

  it('should only affect the specified barang when deleting', async () => {
    // Create two barang items
    const barang1Result = await db.insert(barangTable)
      .values({
        nama_barang: 'Item 1',
        kode_barang: 'ITEM001',
        deskripsi: 'First item',
        harga_beli: '100.00',
        harga_jual: '150.00'
      })
      .returning()
      .execute();

    const barang2Result = await db.insert(barangTable)
      .values({
        nama_barang: 'Item 2',
        kode_barang: 'ITEM002',
        deskripsi: 'Second item',
        harga_beli: '200.00',
        harga_jual: '250.00'
      })
      .returning()
      .execute();

    const barang1Id = barang1Result[0].id;
    const barang2Id = barang2Result[0].id;

    // Delete first barang
    const result = await deleteBarang(barang1Id);
    expect(result.success).toBe(true);

    // Verify first barang is deleted
    const deletedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang1Id))
      .execute();

    expect(deletedBarang).toHaveLength(0);

    // Verify second barang still exists
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang2Id))
      .execute();

    expect(remainingBarang).toHaveLength(1);
    expect(remainingBarang[0].nama_barang).toBe('Item 2');
  });
});
