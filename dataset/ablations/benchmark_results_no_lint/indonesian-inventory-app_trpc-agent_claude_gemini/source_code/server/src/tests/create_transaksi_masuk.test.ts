import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiMasukInput } from '../schema';
import { createTransaksiMasuk } from '../handlers/create_transaksi_masuk';
import { eq } from 'drizzle-orm';

describe('createTransaksiMasuk', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test barang first
  const createTestBarang = async () => {
    const result = await db.insert(barangTable)
      .values({
        nama_barang: 'Test Item',
        kode_sku: 'TEST-001',
        jumlah_stok: 50
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateTransaksiMasukInput = {
    kode_sku: 'TEST-001',
    jumlah: 20,
    tanggal_transaksi: new Date('2024-01-15T10:00:00Z')
  };

  it('should create a transaksi masuk successfully', async () => {
    // Create prerequisite barang
    await createTestBarang();

    const result = await createTransaksiMasuk(testInput);

    // Verify transaction fields
    expect(result.kode_sku).toEqual('TEST-001');
    expect(result.jenis_transaksi).toEqual('masuk');
    expect(result.jumlah).toEqual(20);
    expect(result.tanggal_transaksi).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    // Create prerequisite barang
    await createTestBarang();

    const result = await createTransaksiMasuk(testInput);

    // Verify transaction was saved
    const transactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].kode_sku).toEqual('TEST-001');
    expect(transactions[0].jenis_transaksi).toEqual('masuk');
    expect(transactions[0].jumlah).toEqual(20);
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should update barang stock correctly', async () => {
    // Create prerequisite barang with initial stock
    const initialBarang = await createTestBarang();
    const initialStock = initialBarang.jumlah_stok; // 50

    await createTransaksiMasuk(testInput);

    // Verify stock was updated
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'TEST-001'))
      .execute();

    expect(updatedBarang).toHaveLength(1);
    expect(updatedBarang[0].jumlah_stok).toEqual(initialStock + testInput.jumlah); // 50 + 20 = 70
    expect(updatedBarang[0].updated_at).toBeInstanceOf(Date);
    expect(updatedBarang[0].updated_at.getTime()).toBeGreaterThan(initialBarang.updated_at!.getTime());
  });

  it('should handle multiple transactions for same SKU', async () => {
    // Create prerequisite barang
    await createTestBarang();

    // Create first transaction
    await createTransaksiMasuk({
      kode_sku: 'TEST-001',
      jumlah: 10,
      tanggal_transaksi: new Date('2024-01-15T09:00:00Z')
    });

    // Create second transaction
    await createTransaksiMasuk({
      kode_sku: 'TEST-001',
      jumlah: 15,
      tanggal_transaksi: new Date('2024-01-15T11:00:00Z')
    });

    // Verify final stock
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'TEST-001'))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(75); // 50 + 10 + 15 = 75

    // Verify both transactions exist
    const transactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.kode_sku, 'TEST-001'))
      .execute();

    expect(transactions).toHaveLength(2);
    expect(transactions.every(t => t.jenis_transaksi === 'masuk')).toBe(true);
  });

  it('should use current date when tanggal_transaksi is not provided', async () => {
    // Create prerequisite barang
    await createTestBarang();

    // Simulate what happens after Zod parsing - the default value will be applied
    const beforeTime = new Date();
    
    // Create input that mimics what Zod would produce after applying defaults
    const inputWithDefaultDate: CreateTransaksiMasukInput = {
      kode_sku: 'TEST-001',
      jumlah: 25,
      tanggal_transaksi: new Date() // This simulates the Zod default being applied
    };

    const result = await createTransaksiMasuk(inputWithDefaultDate);
    const afterTime = new Date();

    // Verify the date was properly handled
    expect(result.tanggal_transaksi).toBeInstanceOf(Date);
    expect(result.tanggal_transaksi.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.tanggal_transaksi.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should throw error when barang with SKU does not exist', async () => {
    const nonExistentInput: CreateTransaksiMasukInput = {
      kode_sku: 'NON-EXISTENT',
      jumlah: 10,
      tanggal_transaksi: new Date()
    };

    await expect(createTransaksiMasuk(nonExistentInput))
      .rejects.toThrow(/barang with sku non-existent not found/i);
  });

  it('should handle large stock quantities correctly', async () => {
    // Create barang with large initial stock
    await db.insert(barangTable)
      .values({
        nama_barang: 'Large Stock Item',
        kode_sku: 'LARGE-001',
        jumlah_stok: 999999
      })
      .execute();

    const largeInput: CreateTransaksiMasukInput = {
      kode_sku: 'LARGE-001',
      jumlah: 500000,
      tanggal_transaksi: new Date()
    };

    const result = await createTransaksiMasuk(largeInput);

    expect(result.jumlah).toEqual(500000);

    // Verify stock calculation
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'LARGE-001'))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(1499999); // 999999 + 500000
  });
});
