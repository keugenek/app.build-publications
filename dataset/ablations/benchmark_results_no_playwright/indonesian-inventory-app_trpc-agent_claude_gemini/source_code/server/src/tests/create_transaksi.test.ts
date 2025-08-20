import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transaksiTable, barangTable } from '../db/schema';
import { type CreateTransaksiInput } from '../schema';
import { createTransaksi } from '../handlers/create_transaksi';
import { eq } from 'drizzle-orm';

// Test barang data
const testBarang = {
  nama_barang: 'Test Product',
  kode_barang: 'TEST001',
  deskripsi: 'A product for testing',
  jumlah_stok: 100,
  harga_beli: '50.00',
  harga_jual: '75.00'
};

describe('createTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let barangId: number;

  beforeEach(async () => {
    // Create prerequisite barang for testing
    const barangResult = await db.insert(barangTable)
      .values(testBarang)
      .returning()
      .execute();
    barangId = barangResult[0].id;
  });

  it('should create a Masuk transaction and increase stock', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-01'),
      jenis_transaksi: 'Masuk',
      barang_id: barangId,
      jumlah: 25,
      catatan: 'Stock replenishment'
    };

    const result = await createTransaksi(testInput);

    // Verify transaction fields
    expect(result.id).toBeDefined();
    expect(result.tanggal_transaksi).toBeInstanceOf(Date);
    expect(result.tanggal_transaksi.toISOString().split('T')[0]).toEqual('2024-01-01');
    expect(result.jenis_transaksi).toEqual('Masuk');
    expect(result.barang_id).toEqual(barangId);
    expect(result.jumlah).toEqual(25);
    expect(result.catatan).toEqual('Stock replenishment');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify stock was increased
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(125); // 100 + 25
    expect(updatedBarang[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a Keluar transaction and decrease stock', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-02'),
      jenis_transaksi: 'Keluar',
      barang_id: barangId,
      jumlah: 30,
      catatan: 'Product sale'
    };

    const result = await createTransaksi(testInput);

    // Verify transaction fields
    expect(result.jenis_transaksi).toEqual('Keluar');
    expect(result.jumlah).toEqual(30);
    expect(result.catatan).toEqual('Product sale');

    // Verify stock was decreased
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(70); // 100 - 30
  });

  it('should create transaction with null catatan', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-03'),
      jenis_transaksi: 'Masuk',
      barang_id: barangId,
      jumlah: 10,
      catatan: null
    };

    const result = await createTransaksi(testInput);

    expect(result.catatan).toBeNull();

    // Verify transaction was saved to database
    const transactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].catatan).toBeNull();
  });

  it('should reject Keluar transaction with insufficient stock', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-04'),
      jenis_transaksi: 'Keluar',
      barang_id: barangId,
      jumlah: 150, // More than available stock (100)
      catatan: 'Insufficient stock test'
    };

    await expect(createTransaksi(testInput)).rejects.toThrow(/insufficient stock/i);

    // Verify stock wasn't changed
    const barangAfter = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(barangAfter[0].jumlah_stok).toEqual(100); // Original stock unchanged
  });

  it('should reject transaction for non-existent barang', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-05'),
      jenis_transaksi: 'Masuk',
      barang_id: 99999, // Non-existent ID
      jumlah: 10,
      catatan: 'Non-existent barang test'
    };

    await expect(createTransaksi(testInput)).rejects.toThrow(/barang with id 99999 not found/i);

    // Verify no transaction was created
    const transactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, 99999))
      .execute();

    expect(transactions).toHaveLength(0);
  });

  it('should handle exact stock depletion', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-06'),
      jenis_transaksi: 'Keluar',
      barang_id: barangId,
      jumlah: 100, // Exactly the available stock
      catatan: 'Complete stock depletion'
    };

    const result = await createTransaksi(testInput);

    expect(result.jumlah).toEqual(100);

    // Verify stock is now zero
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(0);
  });

  it('should handle large stock increases', async () => {
    const testInput: CreateTransaksiInput = {
      tanggal_transaksi: new Date('2024-01-07'),
      jenis_transaksi: 'Masuk',
      barang_id: barangId,
      jumlah: 1000,
      catatan: 'Large stock increase'
    };

    const result = await createTransaksi(testInput);

    expect(result.jumlah).toEqual(1000);

    // Verify large stock increase
    const updatedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(updatedBarang[0].jumlah_stok).toEqual(1100); // 100 + 1000
  });
});
