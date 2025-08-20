import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiKeluarInput } from '../schema';
import { createTransaksiKeluar } from '../handlers/create_transaksi_keluar';
import { eq } from 'drizzle-orm';

describe('createTransaksiKeluar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaksi keluar and update stock', async () => {
    // Create prerequisite barang with sufficient stock
    await db.insert(barangTable)
      .values({
        nama_barang: 'Test Item',
        kode_sku: 'TEST-001',
        jumlah_stok: 100
      })
      .execute();

    const testInput: CreateTransaksiKeluarInput = {
      kode_sku: 'TEST-001',
      jumlah: 25,
      tanggal_transaksi: new Date('2024-01-15')
    };

    const result = await createTransaksiKeluar(testInput);

    // Verify transaction record
    expect(result.kode_sku).toEqual('TEST-001');
    expect(result.jenis_transaksi).toEqual('keluar');
    expect(result.jumlah).toEqual(25);
    expect(result.tanggal_transaksi).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify transaction is saved to database
    const transaksiInDb = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transaksiInDb).toHaveLength(1);
    expect(transaksiInDb[0].kode_sku).toEqual('TEST-001');
    expect(transaksiInDb[0].jenis_transaksi).toEqual('keluar');
    expect(transaksiInDb[0].jumlah).toEqual(25);

    // Verify stock is updated correctly (100 - 25 = 75)
    const barangInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'TEST-001'))
      .execute();

    expect(barangInDb).toHaveLength(1);
    expect(barangInDb[0].jumlah_stok).toEqual(75);
    expect(barangInDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should use current date when tanggal_transaksi not provided', async () => {
    // Create prerequisite barang
    await db.insert(barangTable)
      .values({
        nama_barang: 'Test Item',
        kode_sku: 'TEST-002',
        jumlah_stok: 50
      })
      .execute();

    // Note: Since Zod schema has default, the parsed input will always have tanggal_transaksi
    // This test simulates what happens when the default is applied
    const currentDate = new Date();
    const testInput: CreateTransaksiKeluarInput = {
      kode_sku: 'TEST-002',
      jumlah: 10,
      tanggal_transaksi: currentDate // This would be set by Zod default in real usage
    };

    const result = await createTransaksiKeluar(testInput);

    expect(result.tanggal_transaksi).toBeInstanceOf(Date);
    expect(result.tanggal_transaksi).toEqual(currentDate);
  });

  it('should throw error when barang does not exist', async () => {
    const testInput: CreateTransaksiKeluarInput = {
      kode_sku: 'NONEXISTENT',
      jumlah: 10,
      tanggal_transaksi: new Date()
    };

    await expect(createTransaksiKeluar(testInput))
      .rejects
      .toThrow(/tidak ditemukan/i);
  });

  it('should throw error when insufficient stock', async () => {
    // Create barang with limited stock
    await db.insert(barangTable)
      .values({
        nama_barang: 'Limited Item',
        kode_sku: 'LIMITED-001',
        jumlah_stok: 5
      })
      .execute();

    const testInput: CreateTransaksiKeluarInput = {
      kode_sku: 'LIMITED-001',
      jumlah: 10, // Requesting more than available (5)
      tanggal_transaksi: new Date()
    };

    await expect(createTransaksiKeluar(testInput))
      .rejects
      .toThrow(/stok tidak mencukupi/i);

    // Verify stock remains unchanged after failed transaction
    const barangInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'LIMITED-001'))
      .execute();

    expect(barangInDb[0].jumlah_stok).toEqual(5);
  });

  it('should handle exact stock amount withdrawal', async () => {
    // Create barang with exact amount needed
    await db.insert(barangTable)
      .values({
        nama_barang: 'Exact Item',
        kode_sku: 'EXACT-001',
        jumlah_stok: 30
      })
      .execute();

    const testInput: CreateTransaksiKeluarInput = {
      kode_sku: 'EXACT-001',
      jumlah: 30, // Exact amount available
      tanggal_transaksi: new Date()
    };

    const result = await createTransaksiKeluar(testInput);

    expect(result.jumlah).toEqual(30);

    // Verify stock is now zero
    const barangInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'EXACT-001'))
      .execute();

    expect(barangInDb[0].jumlah_stok).toEqual(0);
  });

  it('should handle multiple sequential transactions', async () => {
    // Create barang with sufficient initial stock
    await db.insert(barangTable)
      .values({
        nama_barang: 'Sequential Item',
        kode_sku: 'SEQ-001',
        jumlah_stok: 100
      })
      .execute();

    // First transaction
    await createTransaksiKeluar({
      kode_sku: 'SEQ-001',
      jumlah: 20,
      tanggal_transaksi: new Date('2024-01-10')
    });

    // Second transaction
    await createTransaksiKeluar({
      kode_sku: 'SEQ-001',
      jumlah: 30,
      tanggal_transaksi: new Date('2024-01-15')
    });

    // Verify final stock (100 - 20 - 30 = 50)
    const barangInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'SEQ-001'))
      .execute();

    expect(barangInDb[0].jumlah_stok).toEqual(50);

    // Verify both transactions are recorded
    const transaksiInDb = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.kode_sku, 'SEQ-001'))
      .execute();

    expect(transaksiInDb).toHaveLength(2);
    expect(transaksiInDb[0].jumlah).toEqual(20);
    expect(transaksiInDb[1].jumlah).toEqual(30);
  });
});
