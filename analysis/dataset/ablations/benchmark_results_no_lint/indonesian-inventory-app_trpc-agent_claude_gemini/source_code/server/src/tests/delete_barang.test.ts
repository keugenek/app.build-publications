import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type DeleteBarangInput } from '../schema';
import { deleteBarang } from '../handlers/delete_barang';
import { eq } from 'drizzle-orm';

describe('deleteBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a barang successfully', async () => {
    // Create a test barang first
    const insertResult = await db.insert(barangTable)
      .values({
        nama_barang: 'Test Product',
        kode_sku: 'TEST001',
        jumlah_stok: 10
      })
      .returning()
      .execute();

    const barangId = insertResult[0].id;

    const input: DeleteBarangInput = {
      id: barangId
    };

    const result = await deleteBarang(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify barang is deleted from database
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(remainingBarang).toHaveLength(0);
  });

  it('should throw error when barang does not exist', async () => {
    const input: DeleteBarangInput = {
      id: 999 // Non-existent ID
    };

    await expect(deleteBarang(input)).rejects.toThrow(/barang with id 999 not found/i);
  });

  it('should throw error when barang has related transactions', async () => {
    // Create a test barang first
    const insertResult = await db.insert(barangTable)
      .values({
        nama_barang: 'Test Product with Transactions',
        kode_sku: 'TEST002',
        jumlah_stok: 20
      })
      .returning()
      .execute();

    const barangId = insertResult[0].id;
    const kodeSku = insertResult[0].kode_sku;

    // Create a related transaction
    await db.insert(transaksiTable)
      .values({
        kode_sku: kodeSku,
        jenis_transaksi: 'masuk',
        jumlah: 5,
        tanggal_transaksi: new Date()
      })
      .execute();

    const input: DeleteBarangInput = {
      id: barangId
    };

    await expect(deleteBarang(input)).rejects.toThrow(/cannot delete barang with sku test002 - it has related transactions/i);

    // Verify barang still exists in database
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(remainingBarang).toHaveLength(1);
  });

  it('should allow deletion of barang without any transactions', async () => {
    // Create multiple barang
    const insertResult = await db.insert(barangTable)
      .values([
        {
          nama_barang: 'Product A',
          kode_sku: 'PROD_A',
          jumlah_stok: 15
        },
        {
          nama_barang: 'Product B',
          kode_sku: 'PROD_B',
          jumlah_stok: 25
        }
      ])
      .returning()
      .execute();

    const barangAId = insertResult[0].id;
    const barangBId = insertResult[1].id;
    const barangBSku = insertResult[1].kode_sku;

    // Add transaction only to Product B
    await db.insert(transaksiTable)
      .values({
        kode_sku: barangBSku,
        jenis_transaksi: 'keluar',
        jumlah: 3,
        tanggal_transaksi: new Date()
      })
      .execute();

    // Should be able to delete Product A (no transactions)
    const inputA: DeleteBarangInput = {
      id: barangAId
    };

    const resultA = await deleteBarang(inputA);
    expect(resultA.success).toBe(true);

    // Verify Product A is deleted
    const remainingBarangA = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangAId))
      .execute();

    expect(remainingBarangA).toHaveLength(0);

    // Should NOT be able to delete Product B (has transactions)
    const inputB: DeleteBarangInput = {
      id: barangBId
    };

    await expect(deleteBarang(inputB)).rejects.toThrow(/cannot delete barang with sku prod_b - it has related transactions/i);

    // Verify Product B still exists
    const remainingBarangB = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangBId))
      .execute();

    expect(remainingBarangB).toHaveLength(1);
  });

  it('should handle multiple transaction types correctly', async () => {
    // Create a test barang
    const insertResult = await db.insert(barangTable)
      .values({
        nama_barang: 'Multi Transaction Product',
        kode_sku: 'MULTI001',
        jumlah_stok: 50
      })
      .returning()
      .execute();

    const barangId = insertResult[0].id;
    const kodeSku = insertResult[0].kode_sku;

    // Create multiple transactions of different types
    await db.insert(transaksiTable)
      .values([
        {
          kode_sku: kodeSku,
          jenis_transaksi: 'masuk',
          jumlah: 10,
          tanggal_transaksi: new Date()
        },
        {
          kode_sku: kodeSku,
          jenis_transaksi: 'keluar',
          jumlah: 5,
          tanggal_transaksi: new Date()
        }
      ])
      .execute();

    const input: DeleteBarangInput = {
      id: barangId
    };

    // Should not be able to delete due to multiple related transactions
    await expect(deleteBarang(input)).rejects.toThrow(/cannot delete barang with sku multi001 - it has related transactions/i);

    // Verify barang still exists
    const remainingBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(remainingBarang).toHaveLength(1);
  });
});
