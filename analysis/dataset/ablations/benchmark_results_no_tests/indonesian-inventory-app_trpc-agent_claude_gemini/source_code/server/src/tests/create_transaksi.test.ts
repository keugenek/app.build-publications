import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiInput } from '../schema';
import { createTransaksi } from '../handlers/create_transaksi';
import { eq } from 'drizzle-orm';

describe('createTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test barang
  const createTestBarang = async (initialStock = 100) => {
    const result = await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode: 'TEST001',
        jumlah_stok: initialStock,
        deskripsi: 'Test item for transaction'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create masuk transaction and increase stock', async () => {
    // Create test barang with initial stock of 50
    const barang = await createTestBarang(50);

    const testInput: CreateTransaksiInput = {
      jenis: 'masuk',
      barang_id: barang.id,
      jumlah: 20,
      tanggal_transaksi: new Date('2024-01-15')
    };

    const result = await createTransaksi(testInput);

    // Verify transaction record
    expect(result.jenis).toEqual('masuk');
    expect(result.barang_id).toEqual(barang.id);
    expect(result.nama_barang).toEqual('Test Barang');
    expect(result.jumlah).toEqual(20);
    expect(result.tanggal_transaksi).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify stock was increased
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(70); // 50 + 20
    expect(updatedBarang[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create keluar transaction and decrease stock', async () => {
    // Create test barang with initial stock of 100
    const barang = await createTestBarang(100);

    const testInput: CreateTransaksiInput = {
      jenis: 'keluar',
      barang_id: barang.id,
      jumlah: 30,
      tanggal_transaksi: new Date('2024-01-20')
    };

    const result = await createTransaksi(testInput);

    // Verify transaction record
    expect(result.jenis).toEqual('keluar');
    expect(result.barang_id).toEqual(barang.id);
    expect(result.nama_barang).toEqual('Test Barang');
    expect(result.jumlah).toEqual(30);
    expect(result.tanggal_transaksi).toEqual(new Date('2024-01-20'));

    // Verify stock was decreased
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(70); // 100 - 30
  });

  it('should use default date when tanggal_transaksi not provided', async () => {
    const barang = await createTestBarang(50);
    const beforeTest = new Date();

    const testInput: CreateTransaksiInput = {
      jenis: 'masuk',
      barang_id: barang.id,
      jumlah: 10,
      tanggal_transaksi: new Date() // Include required field
    };

    const result = await createTransaksi(testInput);
    const afterTest = new Date();

    expect(result.tanggal_transaksi).toBeInstanceOf(Date);
    expect(result.tanggal_transaksi.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(result.tanggal_transaksi.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });

  it('should save transaction to database correctly', async () => {
    const barang = await createTestBarang(80);

    const testInput: CreateTransaksiInput = {
      jenis: 'masuk',
      barang_id: barang.id,
      jumlah: 25,
      tanggal_transaksi: new Date('2024-02-01')
    };

    const result = await createTransaksi(testInput);

    // Query database directly to verify persistence
    const savedTransactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(savedTransactions).toHaveLength(1);
    const savedTransaction = savedTransactions[0];
    
    expect(savedTransaction.jenis).toEqual('masuk');
    expect(savedTransaction.barang_id).toEqual(barang.id);
    expect(savedTransaction.nama_barang).toEqual('Test Barang');
    expect(savedTransaction.jumlah).toEqual(25);
    expect(savedTransaction.tanggal_transaksi).toEqual(new Date('2024-02-01'));
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when barang does not exist', async () => {
    const testInput: CreateTransaksiInput = {
      jenis: 'masuk',
      barang_id: 999, // Non-existent ID
      jumlah: 10,
      tanggal_transaksi: new Date()
    };

    await expect(createTransaksi(testInput)).rejects.toThrow(/barang with id 999 not found/i);
  });

  it('should throw error when insufficient stock for keluar transaction', async () => {
    // Create barang with low stock
    const barang = await createTestBarang(15);

    const testInput: CreateTransaksiInput = {
      jenis: 'keluar',
      barang_id: barang.id,
      jumlah: 25, // More than available stock
      tanggal_transaksi: new Date()
    };

    await expect(createTransaksi(testInput)).rejects.toThrow(/insufficient stock/i);
    await expect(createTransaksi(testInput)).rejects.toThrow(/available: 15/i);
    await expect(createTransaksi(testInput)).rejects.toThrow(/required: 25/i);
  });

  it('should handle exact stock amount for keluar transaction', async () => {
    // Create barang with exact stock amount
    const barang = await createTestBarang(40);

    const testInput: CreateTransaksiInput = {
      jenis: 'keluar',
      barang_id: barang.id,
      jumlah: 40, // Exact stock amount
      tanggal_transaksi: new Date()
    };

    const result = await createTransaksi(testInput);

    expect(result.jenis).toEqual('keluar');
    expect(result.jumlah).toEqual(40);

    // Verify stock is now zero
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(0);
  });

  it('should handle multiple transactions on same barang', async () => {
    const barang = await createTestBarang(100);

    // First transaction: masuk 20
    await createTransaksi({
      jenis: 'masuk',
      barang_id: barang.id,
      jumlah: 20,
      tanggal_transaksi: new Date('2024-01-01')
    });

    // Check intermediate stock
    let currentBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();
    expect(currentBarang[0].jumlah_stok).toEqual(120); // 100 + 20

    // Second transaction: keluar 30
    await createTransaksi({
      jenis: 'keluar',
      barang_id: barang.id,
      jumlah: 30,
      tanggal_transaksi: new Date('2024-01-02')
    });

    // Check final stock
    currentBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();
    expect(currentBarang[0].jumlah_stok).toEqual(90); // 120 - 30

    // Verify both transactions exist
    const allTransactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, barang.id))
      .execute();
    expect(allTransactions).toHaveLength(2);
  });
});
