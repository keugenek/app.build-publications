import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transaksiTable, barangTable } from '../db/schema';
import { getAllTransaksi } from '../handlers/get_all_transaksi';

describe('getAllTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getAllTransaksi();

    expect(result).toEqual([]);
  });

  it('should return all transactions ordered by date descending', async () => {
    // Create a test barang first (required for foreign key reference)
    await db.insert(barangTable).values({
      nama_barang: 'Test Item',
      kode_sku: 'TEST-001',
      jumlah_stok: 100
    }).execute();

    // Create test transactions with different dates
    const olderDate = new Date('2024-01-01T10:00:00Z');
    const newerDate = new Date('2024-01-02T10:00:00Z');

    await db.insert(transaksiTable).values([
      {
        kode_sku: 'TEST-001',
        jenis_transaksi: 'masuk',
        jumlah: 10,
        tanggal_transaksi: olderDate
      },
      {
        kode_sku: 'TEST-001',
        jenis_transaksi: 'keluar',
        jumlah: 5,
        tanggal_transaksi: newerDate
      }
    ]).execute();

    const result = await getAllTransaksi();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newest first
    expect(result[0].tanggal_transaksi).toEqual(newerDate);
    expect(result[0].jenis_transaksi).toEqual('keluar');
    expect(result[0].jumlah).toEqual(5);
    
    expect(result[1].tanggal_transaksi).toEqual(olderDate);
    expect(result[1].jenis_transaksi).toEqual('masuk');
    expect(result[1].jumlah).toEqual(10);
  });

  it('should return all transaction fields correctly', async () => {
    // Create a test barang first
    await db.insert(barangTable).values({
      nama_barang: 'Test Item',
      kode_sku: 'TEST-002',
      jumlah_stok: 50
    }).execute();

    // Create a test transaction
    const testDate = new Date('2024-01-15T14:30:00Z');
    await db.insert(transaksiTable).values({
      kode_sku: 'TEST-002',
      jenis_transaksi: 'masuk',
      jumlah: 25,
      tanggal_transaksi: testDate
    }).execute();

    const result = await getAllTransaksi();

    expect(result).toHaveLength(1);
    const transaction = result[0];
    
    // Verify all fields are present and correct
    expect(transaction.id).toBeDefined();
    expect(transaction.kode_sku).toEqual('TEST-002');
    expect(transaction.jenis_transaksi).toEqual('masuk');
    expect(transaction.jumlah).toEqual(25);
    expect(transaction.tanggal_transaksi).toEqual(testDate);
    expect(transaction.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple transactions with different SKUs', async () => {
    // Create test barang items
    await db.insert(barangTable).values([
      {
        nama_barang: 'Item A',
        kode_sku: 'ITEM-A',
        jumlah_stok: 100
      },
      {
        nama_barang: 'Item B',
        kode_sku: 'ITEM-B',
        jumlah_stok: 50
      }
    ]).execute();

    // Create transactions for different SKUs
    const baseDate = new Date('2024-01-10T10:00:00Z');
    
    await db.insert(transaksiTable).values([
      {
        kode_sku: 'ITEM-A',
        jenis_transaksi: 'masuk',
        jumlah: 20,
        tanggal_transaksi: new Date(baseDate.getTime() + 1000) // 1 second later
      },
      {
        kode_sku: 'ITEM-B',
        jenis_transaksi: 'keluar',
        jumlah: 10,
        tanggal_transaksi: new Date(baseDate.getTime() + 2000) // 2 seconds later
      },
      {
        kode_sku: 'ITEM-A',
        jenis_transaksi: 'keluar',
        jumlah: 5,
        tanggal_transaksi: baseDate // earliest
      }
    ]).execute();

    const result = await getAllTransaksi();

    expect(result).toHaveLength(3);
    
    // Verify chronological ordering (newest first)
    expect(result[0].kode_sku).toEqual('ITEM-B');
    expect(result[0].jenis_transaksi).toEqual('keluar');
    
    expect(result[1].kode_sku).toEqual('ITEM-A');
    expect(result[1].jenis_transaksi).toEqual('masuk');
    
    expect(result[2].kode_sku).toEqual('ITEM-A');
    expect(result[2].jenis_transaksi).toEqual('keluar');
  });

  it('should handle transactions with same timestamp correctly', async () => {
    // Create a test barang
    await db.insert(barangTable).values({
      nama_barang: 'Test Item',
      kode_sku: 'TEST-003',
      jumlah_stok: 100
    }).execute();

    // Create multiple transactions with the same timestamp
    const sameDate = new Date('2024-01-20T12:00:00Z');
    
    await db.insert(transaksiTable).values([
      {
        kode_sku: 'TEST-003',
        jenis_transaksi: 'masuk',
        jumlah: 15,
        tanggal_transaksi: sameDate
      },
      {
        kode_sku: 'TEST-003',
        jenis_transaksi: 'keluar',
        jumlah: 8,
        tanggal_transaksi: sameDate
      }
    ]).execute();

    const result = await getAllTransaksi();

    expect(result).toHaveLength(2);
    
    // Both should have the same timestamp
    expect(result[0].tanggal_transaksi).toEqual(sameDate);
    expect(result[1].tanggal_transaksi).toEqual(sameDate);
    
    // Verify all transactions are returned
    const jenis = result.map(t => t.jenis_transaksi).sort();
    expect(jenis).toEqual(['keluar', 'masuk']);
  });
});
