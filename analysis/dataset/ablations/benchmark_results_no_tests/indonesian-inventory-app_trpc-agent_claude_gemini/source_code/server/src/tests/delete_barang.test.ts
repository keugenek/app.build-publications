import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput } from '../schema';
import { deleteBarang } from '../handlers/delete_barang';
import { eq } from 'drizzle-orm';

// Test input for deleting barang
const testInput: DeleteBarangInput = {
  id: 1
};

describe('deleteBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a barang when no related transactions exist', async () => {
    // Create a barang first
    await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode: 'TEST001',
        jumlah_stok: 100,
        deskripsi: 'Barang untuk testing'
      })
      .execute();

    const result = await deleteBarang(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Barang berhasil dihapus');

    // Verify the barang is actually deleted from database
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, testInput.id))
      .execute();

    expect(remainingBarang).toHaveLength(0);
  });

  it('should return error when barang does not exist', async () => {
    const result = await deleteBarang({ id: 999 });

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Barang tidak ditemukan');
  });

  it('should prevent deletion when barang has related transactions', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode: 'TEST001',
        jumlah_stok: 100,
        deskripsi: 'Barang untuk testing'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    // Create related transactions
    await db.insert(transaksiTable)
      .values([
        {
          jenis: 'masuk',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 50,
          tanggal_transaksi: new Date()
        },
        {
          jenis: 'keluar',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 20,
          tanggal_transaksi: new Date()
        }
      ])
      .execute();

    const result = await deleteBarang({ id: barang.id });

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Tidak dapat menghapus barang karena masih memiliki 2 transaksi terkait');

    // Verify the barang still exists in database
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(existingBarang).toHaveLength(1);
    expect(existingBarang[0].nama).toEqual('Test Barang');
  });

  it('should handle single related transaction correctly', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Single Transaction Barang',
        kode: 'SINGLE001',
        jumlah_stok: 50,
        deskripsi: 'Barang dengan satu transaksi'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    // Create one related transaction
    await db.insert(transaksiTable)
      .values({
        jenis: 'masuk',
        barang_id: barang.id,
        nama_barang: barang.nama,
        jumlah: 25,
        tanggal_transaksi: new Date()
      })
      .execute();

    const result = await deleteBarang({ id: barang.id });

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Tidak dapat menghapus barang karena masih memiliki 1 transaksi terkait');

    // Verify the barang still exists
    const existingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(existingBarang).toHaveLength(1);
  });

  it('should successfully delete barang after related transactions are removed', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Deletable Barang',
        kode: 'DELETE001',
        jumlah_stok: 75,
        deskripsi: 'Barang yang bisa dihapus setelah transaksi dihapus'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    // Create and then delete related transaction
    await db.insert(transaksiTable)
      .values({
        jenis: 'masuk',
        barang_id: barang.id,
        nama_barang: barang.nama,
        jumlah: 30,
        tanggal_transaksi: new Date()
      })
      .execute();

    // First deletion attempt should fail
    let result = await deleteBarang({ id: barang.id });
    expect(result.success).toBe(false);

    // Remove the related transaction
    await db.delete(transaksiTable)
      .where(eq(transaksiTable.barang_id, barang.id))
      .execute();

    // Second deletion attempt should succeed
    result = await deleteBarang({ id: barang.id });
    expect(result.success).toBe(true);
    expect(result.message).toEqual('Barang berhasil dihapus');

    // Verify the barang is deleted
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(remainingBarang).toHaveLength(0);
  });
});
