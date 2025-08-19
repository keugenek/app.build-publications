import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { getTransaksi } from '../handlers/get_transaksi';
import { type CreateBarangInput, type CreateTransaksiMasukInput, type CreateTransaksiKeluarInput } from '../schema';

// Test data
const testBarang1: CreateBarangInput = {
  nama: 'Laptop ASUS',
  kode_barang: 'LPT001',
  deskripsi: 'Laptop untuk kerja',
  harga: 15000000,
  stok: 5
};

const testBarang2: CreateBarangInput = {
  nama: 'Mouse Gaming',
  kode_barang: 'MSE001',
  deskripsi: 'Mouse gaming RGB',
  harga: 250000,
  stok: 10
};

describe('getTransaksi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransaksi();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all transactions with barang information', async () => {
    // Create test barang
    const barang1 = await db.insert(barangTable)
      .values({
        nama: testBarang1.nama,
        kode_barang: testBarang1.kode_barang,
        deskripsi: testBarang1.deskripsi,
        harga: testBarang1.harga.toString(),
        stok: testBarang1.stok
      })
      .returning()
      .execute();

    const barang2 = await db.insert(barangTable)
      .values({
        nama: testBarang2.nama,
        kode_barang: testBarang2.kode_barang,
        deskripsi: testBarang2.deskripsi,
        harga: testBarang2.harga.toString(),
        stok: testBarang2.stok
      })
      .returning()
      .execute();

    // Create test transactions
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(transaksiTable)
      .values([
        {
          tanggal: today,
          barang_id: barang1[0].id,
          jenis: 'MASUK',
          jumlah: 10,
          keterangan: 'Pembelian stok baru'
        },
        {
          tanggal: yesterday,
          barang_id: barang2[0].id,
          jenis: 'KELUAR',
          jumlah: 5,
          keterangan: 'Penjualan'
        }
      ])
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(2);
    
    // Should be ordered by tanggal descending (newest first)
    expect(result[0].tanggal >= result[1].tanggal).toBe(true);
    
    // Check first transaction (newest)
    const firstTransaction = result[0];
    expect(firstTransaction.jenis).toBe('MASUK');
    expect(firstTransaction.jumlah).toBe(10);
    expect(firstTransaction.keterangan).toBe('Pembelian stok baru');
    expect(firstTransaction.barang_id).toBe(barang1[0].id);
    
    // Check barang information is included and properly formatted
    expect(firstTransaction.barang).toBeDefined();
    expect(firstTransaction.barang.nama).toBe('Laptop ASUS');
    expect(firstTransaction.barang.kode_barang).toBe('LPT001');
    expect(firstTransaction.barang.harga).toBe(15000000);
    expect(typeof firstTransaction.barang.harga).toBe('number');
    
    // Check second transaction
    const secondTransaction = result[1];
    expect(secondTransaction.jenis).toBe('KELUAR');
    expect(secondTransaction.jumlah).toBe(5);
    expect(secondTransaction.keterangan).toBe('Penjualan');
    expect(secondTransaction.barang_id).toBe(barang2[0].id);
    expect(secondTransaction.barang.nama).toBe('Mouse Gaming');
    expect(secondTransaction.barang.kode_barang).toBe('MSE001');
    expect(secondTransaction.barang.harga).toBe(250000);
  });

  it('should handle transactions with null keterangan and deskripsi', async () => {
    // Create barang with null deskripsi
    const barang = await db.insert(barangTable)
      .values({
        nama: 'Test Item',
        kode_barang: 'TST001',
        deskripsi: null,
        harga: '100000',
        stok: 1
      })
      .returning()
      .execute();

    // Create transaction with null keterangan
    await db.insert(transaksiTable)
      .values({
        tanggal: new Date(),
        barang_id: barang[0].id,
        jenis: 'MASUK',
        jumlah: 1,
        keterangan: null
      })
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(1);
    expect(result[0].keterangan).toBeNull();
    expect(result[0].barang.deskripsi).toBeNull();
    expect(result[0].barang.harga).toBe(100000);
    expect(typeof result[0].barang.harga).toBe('number');
  });

  it('should return all required fields in correct format', async () => {
    // Create test data
    const barang = await db.insert(barangTable)
      .values({
        nama: 'Sample Product',
        kode_barang: 'SMP001',
        deskripsi: 'Sample description',
        harga: '500000.50',
        stok: 20
      })
      .returning()
      .execute();

    await db.insert(transaksiTable)
      .values({
        tanggal: new Date(),
        barang_id: barang[0].id,
        jenis: 'MASUK',
        jumlah: 15,
        keterangan: 'Test transaction'
      })
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(1);
    const transaction = result[0];

    // Check all transaction fields
    expect(transaction.id).toBeDefined();
    expect(transaction.tanggal).toBeInstanceOf(Date);
    expect(transaction.barang_id).toBe(barang[0].id);
    expect(transaction.jenis).toBe('MASUK');
    expect(transaction.jumlah).toBe(15);
    expect(transaction.keterangan).toBe('Test transaction');
    expect(transaction.created_at).toBeInstanceOf(Date);
    expect(transaction.updated_at).toBeInstanceOf(Date);

    // Check all barang fields
    expect(transaction.barang.id).toBeDefined();
    expect(transaction.barang.nama).toBe('Sample Product');
    expect(transaction.barang.kode_barang).toBe('SMP001');
    expect(transaction.barang.deskripsi).toBe('Sample description');
    expect(transaction.barang.harga).toBe(500000.5);
    expect(typeof transaction.barang.harga).toBe('number');
    expect(transaction.barang.stok).toBe(20);
    expect(transaction.barang.created_at).toBeInstanceOf(Date);
    expect(transaction.barang.updated_at).toBeInstanceOf(Date);
  });

  it('should order transactions by tanggal in descending order', async () => {
    // Create test barang
    const barang = await db.insert(barangTable)
      .values({
        nama: 'Test Item',
        kode_barang: 'TST001',
        deskripsi: 'Test item for ordering',
        harga: '100000',
        stok: 100
      })
      .returning()
      .execute();

    // Create transactions with different dates
    const date1 = new Date('2023-01-01');
    const date2 = new Date('2023-06-15');
    const date3 = new Date('2023-12-31');

    await db.insert(transaksiTable)
      .values([
        {
          tanggal: date2, // Middle date
          barang_id: barang[0].id,
          jenis: 'MASUK',
          jumlah: 10,
          keterangan: 'Middle transaction'
        },
        {
          tanggal: date1, // Oldest date
          barang_id: barang[0].id,
          jenis: 'KELUAR',
          jumlah: 5,
          keterangan: 'Oldest transaction'
        },
        {
          tanggal: date3, // Newest date
          barang_id: barang[0].id,
          jenis: 'MASUK',
          jumlah: 20,
          keterangan: 'Newest transaction'
        }
      ])
      .execute();

    const result = await getTransaksi();

    expect(result).toHaveLength(3);
    
    // Should be in descending order by tanggal (newest first)
    expect(result[0].keterangan).toBe('Newest transaction');
    expect(result[1].keterangan).toBe('Middle transaction');
    expect(result[2].keterangan).toBe('Oldest transaction');
    
    // Verify dates are in descending order
    expect(result[0].tanggal.getTime()).toBeGreaterThan(result[1].tanggal.getTime());
    expect(result[1].tanggal.getTime()).toBeGreaterThan(result[2].tanggal.getTime());
  });
});
