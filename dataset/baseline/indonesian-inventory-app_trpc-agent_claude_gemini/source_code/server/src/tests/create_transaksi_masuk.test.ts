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

  // Helper function to create a test barang
  const createTestBarang = async () => {
    const result = await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode_barang: 'TEST001',
        deskripsi: 'Barang untuk testing',
        harga: '10000.00', // String format for numeric column
        stok: 50
      })
      .returning()
      .execute();
    
    return result[0];
  };

  const testInput: CreateTransaksiMasukInput = {
    tanggal: new Date('2024-01-15'),
    barang_id: 1, // Will be updated with actual ID
    jumlah: 25,
    keterangan: 'Transaksi masuk testing'
  };

  it('should create transaksi masuk and increase barang stock', async () => {
    // Create prerequisite barang
    const barang = await createTestBarang();
    const initialStok = barang.stok;
    
    const input = { ...testInput, barang_id: barang.id };
    const result = await createTransaksiMasuk(input);

    // Verify transaction fields
    expect(result.id).toBeDefined();
    expect(result.tanggal).toEqual(new Date('2024-01-15'));
    expect(result.barang_id).toEqual(barang.id);
    expect(result.jenis).toEqual('MASUK');
    expect(result.jumlah).toEqual(25);
    expect(result.keterangan).toEqual('Transaksi masuk testing');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify barang information is included
    expect(result.barang).toBeDefined();
    expect(result.barang.id).toEqual(barang.id);
    expect(result.barang.nama).toEqual('Test Barang');
    expect(result.barang.kode_barang).toEqual('TEST001');
    expect(typeof result.barang.harga).toBe('number');
    expect(result.barang.harga).toEqual(10000);
    
    // Verify stock was increased correctly
    expect(result.barang.stok).toEqual(initialStok + 25);
  });

  it('should save transaksi to database correctly', async () => {
    const barang = await createTestBarang();
    const input = { ...testInput, barang_id: barang.id };
    
    const result = await createTransaksiMasuk(input);

    // Query the created transaksi from database
    const transaksiFromDb = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transaksiFromDb).toHaveLength(1);
    
    const savedTransaksi = transaksiFromDb[0];
    expect(savedTransaksi.tanggal).toEqual(new Date('2024-01-15'));
    expect(savedTransaksi.barang_id).toEqual(barang.id);
    expect(savedTransaksi.jenis).toEqual('MASUK');
    expect(savedTransaksi.jumlah).toEqual(25);
    expect(savedTransaksi.keterangan).toEqual('Transaksi masuk testing');
  });

  it('should update barang stock in database', async () => {
    const barang = await createTestBarang();
    const initialStok = barang.stok;
    const input = { ...testInput, barang_id: barang.id };

    await createTransaksiMasuk(input);

    // Query the updated barang from database
    const barangFromDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barang.id))
      .execute();

    expect(barangFromDb).toHaveLength(1);
    expect(barangFromDb[0].stok).toEqual(initialStok + 25);
    expect(barangFromDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null keterangan correctly', async () => {
    const barang = await createTestBarang();
    const input = {
      tanggal: new Date('2024-01-15'),
      barang_id: barang.id,
      jumlah: 10,
      keterangan: null
    };

    const result = await createTransaksiMasuk(input);

    expect(result.keterangan).toBeNull();
    
    // Verify in database
    const transaksiFromDb = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transaksiFromDb[0].keterangan).toBeNull();
  });

  it('should work with large stock increase', async () => {
    const barang = await createTestBarang();
    const initialStok = barang.stok;
    const largeAmount = 1000;
    
    const input = {
      tanggal: new Date('2024-01-15'),
      barang_id: barang.id,
      jumlah: largeAmount,
      keterangan: 'Large stock increase'
    };

    const result = await createTransaksiMasuk(input);

    expect(result.barang.stok).toEqual(initialStok + largeAmount);
    expect(result.jumlah).toEqual(largeAmount);
  });

  it('should throw error when barang_id does not exist', async () => {
    const input = {
      tanggal: new Date('2024-01-15'),
      barang_id: 9999, // Non-existent ID
      jumlah: 10,
      keterangan: 'Should fail'
    };

    await expect(createTransaksiMasuk(input)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('should work with zero initial stock', async () => {
    // Create barang with zero stock
    const result = await db.insert(barangTable)
      .values({
        nama: 'Zero Stock Item',
        kode_barang: 'ZERO001',
        deskripsi: 'Item with zero stock',
        harga: '5000.00',
        stok: 0
      })
      .returning()
      .execute();
    
    const barang = result[0];
    
    const input = {
      tanggal: new Date('2024-01-15'),
      barang_id: barang.id,
      jumlah: 15,
      keterangan: 'First stock'
    };

    const transaksiResult = await createTransaksiMasuk(input);

    expect(transaksiResult.barang.stok).toEqual(15);
    expect(transaksiResult.jumlah).toEqual(15);
  });

  it('should preserve barang information correctly', async () => {
    const barang = await createTestBarang();
    const input = { ...testInput, barang_id: barang.id };

    const result = await createTransaksiMasuk(input);

    // Verify all barang fields are preserved
    expect(result.barang.nama).toEqual(barang.nama);
    expect(result.barang.kode_barang).toEqual(barang.kode_barang);
    expect(result.barang.deskripsi).toEqual(barang.deskripsi);
    expect(result.barang.created_at).toBeInstanceOf(Date);
    expect(result.barang.updated_at).toBeInstanceOf(Date);
    expect(result.barang.updated_at.getTime()).toBeGreaterThan(barang.updated_at.getTime());
  });
});
