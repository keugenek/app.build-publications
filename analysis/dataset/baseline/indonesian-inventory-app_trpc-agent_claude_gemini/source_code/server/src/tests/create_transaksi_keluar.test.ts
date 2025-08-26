import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type CreateTransaksiKeluarInput } from '../schema';
import { createTransaksiKeluar } from '../handlers/create_transaksi_keluar';
import { eq } from 'drizzle-orm';

// Test input for transaksi keluar
const testInput: CreateTransaksiKeluarInput = {
  tanggal: new Date('2024-01-15'),
  barang_id: 1,
  jumlah: 5,
  keterangan: 'Barang keluar untuk testing'
};

describe('createTransaksiKeluar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test barang
  const createTestBarang = async (stok = 10) => {
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Item',
        kode_barang: 'TEST001',
        deskripsi: 'Item for testing',
        harga: '25.50',
        stok: stok
      })
      .returning()
      .execute();
    
    return barangResult[0];
  };

  it('should create transaksi keluar and decrease stock', async () => {
    // Create test barang with sufficient stock
    const testBarang = await createTestBarang(10);
    const inputWithCorrectId = { ...testInput, barang_id: testBarang.id };

    const result = await createTransaksiKeluar(inputWithCorrectId);

    // Validate transaction fields
    expect(result.id).toBeDefined();
    expect(result.tanggal).toEqual(new Date('2024-01-15'));
    expect(result.barang_id).toEqual(testBarang.id);
    expect(result.jenis).toEqual('KELUAR');
    expect(result.jumlah).toEqual(5);
    expect(result.keterangan).toEqual('Barang keluar untuk testing');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate barang information
    expect(result.barang.id).toEqual(testBarang.id);
    expect(result.barang.nama).toEqual('Test Item');
    expect(result.barang.kode_barang).toEqual('TEST001');
    expect(result.barang.harga).toEqual(25.50);
    expect(result.barang.stok).toEqual(5); // 10 - 5 = 5
    expect(typeof result.barang.harga).toBe('number');
  });

  it('should save transaksi to database', async () => {
    const testBarang = await createTestBarang(15);
    const inputWithCorrectId = { ...testInput, barang_id: testBarang.id };

    const result = await createTransaksiKeluar(inputWithCorrectId);

    // Check if transaksi was saved to database
    const transaksiInDb = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.id, result.id))
      .execute();

    expect(transaksiInDb).toHaveLength(1);
    expect(transaksiInDb[0].barang_id).toEqual(testBarang.id);
    expect(transaksiInDb[0].jenis).toEqual('KELUAR');
    expect(transaksiInDb[0].jumlah).toEqual(5);
    expect(transaksiInDb[0].created_at).toBeInstanceOf(Date);
  });

  it('should update barang stock in database', async () => {
    const testBarang = await createTestBarang(20);
    const inputWithCorrectId = { ...testInput, barang_id: testBarang.id, jumlah: 8 };

    await createTransaksiKeluar(inputWithCorrectId);

    // Check if barang stock was updated
    const barangInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, testBarang.id))
      .execute();

    expect(barangInDb).toHaveLength(1);
    expect(barangInDb[0].stok).toEqual(12); // 20 - 8 = 12
    expect(barangInDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null keterangan', async () => {
    const testBarang = await createTestBarang(10);
    const inputWithNullKeterangan = { 
      ...testInput, 
      barang_id: testBarang.id, 
      keterangan: null 
    };

    const result = await createTransaksiKeluar(inputWithNullKeterangan);

    expect(result.keterangan).toBeNull();
  });

  it('should throw error when barang does not exist', async () => {
    const inputWithInvalidId = { ...testInput, barang_id: 999 };

    await expect(createTransaksiKeluar(inputWithInvalidId))
      .rejects.toThrow(/barang dengan id 999 tidak ditemukan/i);
  });

  it('should throw error when stock is insufficient', async () => {
    // Create barang with insufficient stock
    const testBarang = await createTestBarang(3);
    const inputWithInsufficientStock = { 
      ...testInput, 
      barang_id: testBarang.id, 
      jumlah: 5 // More than available stock (3)
    };

    await expect(createTransaksiKeluar(inputWithInsufficientStock))
      .rejects.toThrow(/stok tidak mencukupi/i);
  });

  it('should throw error when requested amount equals zero stock', async () => {
    const testBarang = await createTestBarang(0); // No stock
    const inputWithZeroStock = { 
      ...testInput, 
      barang_id: testBarang.id, 
      jumlah: 1 
    };

    await expect(createTransaksiKeluar(inputWithZeroStock))
      .rejects.toThrow(/stok tidak mencukupi.*stok tersedia: 0.*diminta: 1/i);
  });

  it('should handle exact stock amount', async () => {
    // Create barang with exact stock needed
    const testBarang = await createTestBarang(7);
    const inputWithExactStock = { 
      ...testInput, 
      barang_id: testBarang.id, 
      jumlah: 7 // Exactly the available stock
    };

    const result = await createTransaksiKeluar(inputWithExactStock);

    expect(result.barang.stok).toEqual(0); // Should be zero after transaction
  });
});
