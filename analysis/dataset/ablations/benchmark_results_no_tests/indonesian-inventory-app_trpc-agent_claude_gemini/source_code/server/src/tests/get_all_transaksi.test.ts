import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { getAllTransaksi } from '../handlers/get_all_transaksi';

describe('getAllTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getAllTransaksi();

    expect(result).toEqual([]);
  });

  it('should return all transactions ordered by tanggal_transaksi descending', async () => {
    // Create test barang first (required for foreign key)
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Product',
        kode: 'TEST001',
        jumlah_stok: 100,
        deskripsi: 'Test description'
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create test transactions with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transaksiData = [
      {
        jenis: 'masuk' as const,
        barang_id: barangId,
        nama_barang: 'Test Product',
        jumlah: 10,
        tanggal_transaksi: yesterday
      },
      {
        jenis: 'keluar' as const,
        barang_id: barangId,
        nama_barang: 'Test Product',
        jumlah: 5,
        tanggal_transaksi: tomorrow
      },
      {
        jenis: 'masuk' as const,
        barang_id: barangId,
        nama_barang: 'Test Product',
        jumlah: 20,
        tanggal_transaksi: today
      }
    ];

    // Insert transactions
    for (const data of transaksiData) {
      await db.insert(transaksiTable)
        .values(data)
        .execute();
    }

    const result = await getAllTransaksi();

    // Should return 3 transactions
    expect(result).toHaveLength(3);

    // Should be ordered by tanggal_transaksi descending (newest first)
    expect(result[0].tanggal_transaksi).toEqual(tomorrow);
    expect(result[1].tanggal_transaksi).toEqual(today);
    expect(result[2].tanggal_transaksi).toEqual(yesterday);

    // Verify transaction details
    expect(result[0].jenis).toEqual('keluar');
    expect(result[0].jumlah).toEqual(5);
    expect(result[0].barang_id).toEqual(barangId);
    expect(result[0].nama_barang).toEqual('Test Product');

    expect(result[1].jenis).toEqual('masuk');
    expect(result[1].jumlah).toEqual(20);

    expect(result[2].jenis).toEqual('masuk');
    expect(result[2].jumlah).toEqual(10);

    // Verify all transactions have required fields
    result.forEach(transaksi => {
      expect(transaksi.id).toBeDefined();
      expect(transaksi.jenis).toMatch(/^(masuk|keluar)$/);
      expect(transaksi.barang_id).toEqual(barangId);
      expect(transaksi.nama_barang).toEqual('Test Product');
      expect(typeof transaksi.jumlah).toBe('number');
      expect(transaksi.tanggal_transaksi).toBeInstanceOf(Date);
      expect(transaksi.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle multiple transactions with same date correctly', async () => {
    // Create test barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Product',
        kode: 'TEST002',
        jumlah_stok: 50
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;
    const sameDate = new Date('2024-01-15T10:00:00Z');

    // Create multiple transactions with same date
    const transaksiData = [
      {
        jenis: 'masuk' as const,
        barang_id: barangId,
        nama_barang: 'Test Product',
        jumlah: 15,
        tanggal_transaksi: sameDate
      },
      {
        jenis: 'keluar' as const,
        barang_id: barangId,
        nama_barang: 'Test Product',
        jumlah: 8,
        tanggal_transaksi: sameDate
      }
    ];

    for (const data of transaksiData) {
      await db.insert(transaksiTable)
        .values(data)
        .execute();
    }

    const result = await getAllTransaksi();

    expect(result).toHaveLength(2);
    
    // Both should have the same date
    result.forEach(transaksi => {
      expect(transaksi.tanggal_transaksi).toEqual(sameDate);
    });

    // Verify different transaction types exist
    const jenisTypes = result.map(t => t.jenis);
    expect(jenisTypes).toContain('masuk');
    expect(jenisTypes).toContain('keluar');
  });

  it('should handle transactions from different barang correctly', async () => {
    // Create two different barang
    const barang1 = await db.insert(barangTable)
      .values({
        nama: 'Product 1',
        kode: 'PROD001',
        jumlah_stok: 100
      })
      .returning()
      .execute();

    const barang2 = await db.insert(barangTable)
      .values({
        nama: 'Product 2',
        kode: 'PROD002',
        jumlah_stok: 50
      })
      .returning()
      .execute();

    const today = new Date();

    // Create transactions for both barang
    await db.insert(transaksiTable)
      .values({
        jenis: 'masuk',
        barang_id: barang1[0].id,
        nama_barang: 'Product 1',
        jumlah: 25,
        tanggal_transaksi: today
      })
      .execute();

    await db.insert(transaksiTable)
      .values({
        jenis: 'keluar',
        barang_id: barang2[0].id,
        nama_barang: 'Product 2',
        jumlah: 10,
        tanggal_transaksi: today
      })
      .execute();

    const result = await getAllTransaksi();

    expect(result).toHaveLength(2);

    // Verify different products are represented
    const productNames = result.map(t => t.nama_barang);
    expect(productNames).toContain('Product 1');
    expect(productNames).toContain('Product 2');

    const barangIds = result.map(t => t.barang_id);
    expect(barangIds).toContain(barang1[0].id);
    expect(barangIds).toContain(barang2[0].id);
  });
});
