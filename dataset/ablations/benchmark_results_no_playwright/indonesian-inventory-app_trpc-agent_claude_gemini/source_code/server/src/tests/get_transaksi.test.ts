import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { getTransaksi, getTransaksiByBarangId } from '../handlers/get_transaksi';

// Test data for barang
const testBarang1 = {
  nama_barang: 'Test Item 1',
  kode_barang: 'TEST001',
  deskripsi: 'Test item description 1',
  jumlah_stok: 50,
  harga_beli: '10000.00',
  harga_jual: '15000.00'
};

const testBarang2 = {
  nama_barang: 'Test Item 2',
  kode_barang: 'TEST002',
  deskripsi: 'Test item description 2',
  jumlah_stok: 30,
  harga_beli: '20000.00',
  harga_jual: '25000.00'
};

describe('getTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransaksi();
    expect(result).toEqual([]);
  });

  it('should return transactions with barang details', async () => {
    // Create test barang first
    const [barang1, barang2] = await db.insert(barangTable)
      .values([testBarang1, testBarang2])
      .returning()
      .execute();

    // Create test transactions
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(transaksiTable)
      .values([
        {
          tanggal_transaksi: now,
          jenis_transaksi: 'Masuk',
          barang_id: barang1.id,
          jumlah: 10,
          catatan: 'Test transaction 1'
        },
        {
          tanggal_transaksi: yesterday,
          jenis_transaksi: 'Keluar',
          barang_id: barang2.id,
          jumlah: 5,
          catatan: 'Test transaction 2'
        }
      ])
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(2);

    // Check if ordered by tanggal_transaksi descending (newest first)
    expect(result[0].tanggal_transaksi >= result[1].tanggal_transaksi).toBe(true);

    // Verify first transaction (most recent)
    const firstTransaction = result[0];
    expect(firstTransaction.jenis_transaksi).toEqual('Masuk');
    expect(firstTransaction.jumlah).toEqual(10);
    expect(firstTransaction.catatan).toEqual('Test transaction 1');
    expect(firstTransaction.barang_id).toEqual(barang1.id);

    // Verify barang details are included with proper numeric conversions
    expect(firstTransaction.barang.id).toEqual(barang1.id);
    expect(firstTransaction.barang.nama_barang).toEqual('Test Item 1');
    expect(firstTransaction.barang.kode_barang).toEqual('TEST001');
    expect(firstTransaction.barang.deskripsi).toEqual('Test item description 1');
    expect(firstTransaction.barang.jumlah_stok).toEqual(50);
    expect(typeof firstTransaction.barang.harga_beli).toBe('number');
    expect(firstTransaction.barang.harga_beli).toEqual(10000);
    expect(typeof firstTransaction.barang.harga_jual).toBe('number');
    expect(firstTransaction.barang.harga_jual).toEqual(15000);

    // Verify second transaction
    const secondTransaction = result[1];
    expect(secondTransaction.jenis_transaksi).toEqual('Keluar');
    expect(secondTransaction.jumlah).toEqual(5);
    expect(secondTransaction.catatan).toEqual('Test transaction 2');
    expect(secondTransaction.barang_id).toEqual(barang2.id);
    expect(secondTransaction.barang.nama_barang).toEqual('Test Item 2');
    expect(secondTransaction.barang.harga_beli).toEqual(20000);
    expect(secondTransaction.barang.harga_jual).toEqual(25000);
  });

  it('should handle transactions with null values correctly', async () => {
    // Create barang with null harga values
    const barangWithNulls = {
      nama_barang: 'Test Item Null',
      kode_barang: 'TEST003',
      deskripsi: null,
      jumlah_stok: 0,
      harga_beli: null,
      harga_jual: null
    };

    const [barang] = await db.insert(barangTable)
      .values(barangWithNulls)
      .returning()
      .execute();

    // Create transaction with null catatan
    await db.insert(transaksiTable)
      .values({
        tanggal_transaksi: new Date(),
        jenis_transaksi: 'Masuk',
        barang_id: barang.id,
        jumlah: 1,
        catatan: null
      })
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(1);
    const transaction = result[0];
    expect(transaction.catatan).toBeNull();
    expect(transaction.barang.deskripsi).toBeNull();
    expect(transaction.barang.harga_beli).toBeNull();
    expect(transaction.barang.harga_jual).toBeNull();
  });

  it('should return all transactions with proper date types', async () => {
    // Create test barang
    const [barang] = await db.insert(barangTable)
      .values(testBarang1)
      .returning()
      .execute();

    // Create transaction
    await db.insert(transaksiTable)
      .values({
        tanggal_transaksi: new Date(),
        jenis_transaksi: 'Masuk',
        barang_id: barang.id,
        jumlah: 1,
        catatan: 'Date test'
      })
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(1);
    const transaction = result[0];
    expect(transaction.tanggal_transaksi).toBeInstanceOf(Date);
    expect(transaction.created_at).toBeInstanceOf(Date);
    expect(transaction.updated_at).toBeInstanceOf(Date);
    expect(transaction.barang.created_at).toBeInstanceOf(Date);
    expect(transaction.barang.updated_at).toBeInstanceOf(Date);
  });
});

describe('getTransaksiByBarangId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist for barang', async () => {
    // Create barang without transactions
    const [barang] = await db.insert(barangTable)
      .values(testBarang1)
      .returning()
      .execute();

    const result = await getTransaksiByBarangId(barang.id);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent barang ID', async () => {
    const result = await getTransaksiByBarangId(99999);
    expect(result).toEqual([]);
  });

  it('should return transactions for specific barang ID ordered by date', async () => {
    // Create test barang
    const [barang1, barang2] = await db.insert(barangTable)
      .values([testBarang1, testBarang2])
      .returning()
      .execute();

    // Create transactions for different dates
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(transaksiTable)
      .values([
        {
          tanggal_transaksi: now,
          jenis_transaksi: 'Masuk',
          barang_id: barang1.id,
          jumlah: 10,
          catatan: 'Latest transaction'
        },
        {
          tanggal_transaksi: twoDaysAgo,
          jenis_transaksi: 'Keluar',
          barang_id: barang1.id,
          jumlah: 5,
          catatan: 'Oldest transaction'
        },
        {
          tanggal_transaksi: yesterday,
          jenis_transaksi: 'Masuk',
          barang_id: barang1.id,
          jumlah: 15,
          catatan: 'Middle transaction'
        },
        {
          tanggal_transaksi: now,
          jenis_transaksi: 'Masuk',
          barang_id: barang2.id,
          jumlah: 8,
          catatan: 'Different barang transaction'
        }
      ])
      .execute();

    const result = await getTransaksiByBarangId(barang1.id);

    expect(result).toHaveLength(3);

    // Check ordering (newest first)
    expect(result[0].tanggal_transaksi >= result[1].tanggal_transaksi).toBe(true);
    expect(result[1].tanggal_transaksi >= result[2].tanggal_transaksi).toBe(true);

    // Verify content
    expect(result[0].catatan).toEqual('Latest transaction');
    expect(result[1].catatan).toEqual('Middle transaction');
    expect(result[2].catatan).toEqual('Oldest transaction');

    // All transactions should belong to barang1
    result.forEach(transaction => {
      expect(transaction.barang_id).toEqual(barang1.id);
    });
  });

  it('should return only transactions for specified barang ID', async () => {
    // Create test barang
    const [barang1, barang2] = await db.insert(barangTable)
      .values([testBarang1, testBarang2])
      .returning()
      .execute();

    // Create transactions for both barang
    await db.insert(transaksiTable)
      .values([
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Masuk',
          barang_id: barang1.id,
          jumlah: 10,
          catatan: 'Barang 1 transaction 1'
        },
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Keluar',
          barang_id: barang1.id,
          jumlah: 5,
          catatan: 'Barang 1 transaction 2'
        },
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Masuk',
          barang_id: barang2.id,
          jumlah: 8,
          catatan: 'Barang 2 transaction'
        }
      ])
      .execute();

    const result = await getTransaksiByBarangId(barang1.id);

    expect(result).toHaveLength(2);
    result.forEach(transaction => {
      expect(transaction.barang_id).toEqual(barang1.id);
      expect(transaction.catatan?.includes('Barang 1')).toBe(true);
    });
  });

  it('should handle different transaction types correctly', async () => {
    // Create test barang
    const [barang] = await db.insert(barangTable)
      .values(testBarang1)
      .returning()
      .execute();

    // Create transactions with different types
    await db.insert(transaksiTable)
      .values([
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Masuk',
          barang_id: barang.id,
          jumlah: 10,
          catatan: 'Incoming transaction'
        },
        {
          tanggal_transaksi: new Date(),
          jenis_transaksi: 'Keluar',
          barang_id: barang.id,
          jumlah: 5,
          catatan: 'Outgoing transaction'
        }
      ])
      .execute();

    const result = await getTransaksiByBarangId(barang.id);

    expect(result).toHaveLength(2);
    
    const jenisTransaksiValues = result.map(t => t.jenis_transaksi);
    expect(jenisTransaksiValues).toContain('Masuk');
    expect(jenisTransaksiValues).toContain('Keluar');
  });
});
