import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type GetTransaksiBySkuInput } from '../schema';
import { getTransaksiBySku } from '../handlers/get_transaksi_by_sku';

describe('getTransaksiBySku', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist for SKU', async () => {
    const input: GetTransaksiBySkuInput = {
      kode_sku: 'NONEXISTENT-SKU'
    };

    const result = await getTransaksiBySku(input);
    
    expect(result).toEqual([]);
  });

  it('should return transactions for specific SKU ordered by date descending', async () => {
    // Create test barang first
    await db.insert(barangTable).values({
      nama_barang: 'Test Item',
      kode_sku: 'TEST-SKU-001',
      jumlah_stok: 100
    });

    // Create test transactions with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(transaksiTable).values([
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'masuk',
        jumlah: 50,
        tanggal_transaksi: twoDaysAgo
      },
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'keluar',
        jumlah: 20,
        tanggal_transaksi: today
      },
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'masuk',
        jumlah: 30,
        tanggal_transaksi: yesterday
      }
    ]);

    const input: GetTransaksiBySkuInput = {
      kode_sku: 'TEST-SKU-001'
    };

    const result = await getTransaksiBySku(input);

    // Should return 3 transactions
    expect(result).toHaveLength(3);

    // Should be ordered by tanggal_transaksi descending (newest first)
    expect(result[0].tanggal_transaksi.getTime()).toBeGreaterThanOrEqual(
      result[1].tanggal_transaksi.getTime()
    );
    expect(result[1].tanggal_transaksi.getTime()).toBeGreaterThanOrEqual(
      result[2].tanggal_transaksi.getTime()
    );

    // Verify the order - today's transaction should be first
    expect(result[0].jenis_transaksi).toEqual('keluar');
    expect(result[0].jumlah).toEqual(20);
    
    // Yesterday's transaction should be second
    expect(result[1].jenis_transaksi).toEqual('masuk');
    expect(result[1].jumlah).toEqual(30);
    
    // Two days ago transaction should be last
    expect(result[2].jenis_transaksi).toEqual('masuk');
    expect(result[2].jumlah).toEqual(50);

    // Verify all transactions have the correct SKU
    result.forEach(transaksi => {
      expect(transaksi.kode_sku).toEqual('TEST-SKU-001');
      expect(transaksi.id).toBeDefined();
      expect(transaksi.created_at).toBeInstanceOf(Date);
    });
  });

  it('should only return transactions for the specified SKU', async () => {
    // Create test barang for multiple SKUs
    await db.insert(barangTable).values([
      {
        nama_barang: 'Test Item 1',
        kode_sku: 'TEST-SKU-001',
        jumlah_stok: 100
      },
      {
        nama_barang: 'Test Item 2',
        kode_sku: 'TEST-SKU-002',
        jumlah_stok: 50
      }
    ]);

    // Create transactions for both SKUs
    await db.insert(transaksiTable).values([
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'masuk',
        jumlah: 25,
        tanggal_transaksi: new Date()
      },
      {
        kode_sku: 'TEST-SKU-002',
        jenis_transaksi: 'masuk',
        jumlah: 15,
        tanggal_transaksi: new Date()
      },
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'keluar',
        jumlah: 10,
        tanggal_transaksi: new Date()
      }
    ]);

    const input: GetTransaksiBySkuInput = {
      kode_sku: 'TEST-SKU-001'
    };

    const result = await getTransaksiBySku(input);

    // Should only return transactions for TEST-SKU-001
    expect(result).toHaveLength(2);
    result.forEach(transaksi => {
      expect(transaksi.kode_sku).toEqual('TEST-SKU-001');
    });

    // Verify the correct transactions were returned
    const jumlahValues = result.map(t => t.jumlah).sort((a, b) => a - b);
    expect(jumlahValues).toEqual([10, 25]);
  });

  it('should handle transactions with same timestamp correctly', async () => {
    // Create test barang
    await db.insert(barangTable).values({
      nama_barang: 'Test Item',
      kode_sku: 'TEST-SKU-001',
      jumlah_stok: 100
    });

    // Create multiple transactions with the same timestamp
    const sameTimestamp = new Date();
    await db.insert(transaksiTable).values([
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'masuk',
        jumlah: 10,
        tanggal_transaksi: sameTimestamp
      },
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'keluar',
        jumlah: 5,
        tanggal_transaksi: sameTimestamp
      },
      {
        kode_sku: 'TEST-SKU-001',
        jenis_transaksi: 'masuk',
        jumlah: 20,
        tanggal_transaksi: sameTimestamp
      }
    ]);

    const input: GetTransaksiBySkuInput = {
      kode_sku: 'TEST-SKU-001'
    };

    const result = await getTransaksiBySku(input);

    // Should return all 3 transactions
    expect(result).toHaveLength(3);
    
    // All should have the same timestamp
    result.forEach(transaksi => {
      expect(transaksi.tanggal_transaksi.getTime()).toEqual(sameTimestamp.getTime());
      expect(transaksi.kode_sku).toEqual('TEST-SKU-001');
    });

    // Verify all expected amounts are present
    const amounts = result.map(t => t.jumlah).sort((a, b) => a - b);
    expect(amounts).toEqual([5, 10, 20]);
  });
});
