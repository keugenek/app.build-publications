import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type GetTransaksiByBarangIdInput } from '../schema';
import { getTransaksiByBarangId } from '../handlers/get_transaksi_by_barang_id';
import { eq } from 'drizzle-orm';

describe('getTransaksiByBarangId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist for barang', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode: 'TB001',
        jumlah_stok: 100,
        deskripsi: 'Test barang untuk testing'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    const input: GetTransaksiByBarangIdInput = {
      barang_id: barang.id
    };

    const result = await getTransaksiByBarangId(input);

    expect(result).toEqual([]);
  });

  it('should return transactions for specific barang ID ordered by date descending', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Barang',
        kode: 'TB001',
        jumlah_stok: 100,
        deskripsi: 'Test barang untuk testing'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    // Create multiple transactions with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(transaksiTable)
      .values([
        {
          jenis: 'masuk',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 50,
          tanggal_transaksi: twoDaysAgo
        },
        {
          jenis: 'keluar',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 20,
          tanggal_transaksi: today
        },
        {
          jenis: 'masuk',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 30,
          tanggal_transaksi: yesterday
        }
      ])
      .execute();

    const input: GetTransaksiByBarangIdInput = {
      barang_id: barang.id
    };

    const result = await getTransaksiByBarangId(input);

    // Should return 3 transactions
    expect(result).toHaveLength(3);

    // Should be ordered by tanggal_transaksi descending (newest first)
    expect(result[0].tanggal_transaksi >= result[1].tanggal_transaksi).toBe(true);
    expect(result[1].tanggal_transaksi >= result[2].tanggal_transaksi).toBe(true);

    // Verify the actual order
    expect(result[0].jenis).toEqual('keluar'); // Today's transaction
    expect(result[0].jumlah).toEqual(20);
    expect(result[1].jenis).toEqual('masuk'); // Yesterday's transaction
    expect(result[1].jumlah).toEqual(30);
    expect(result[2].jenis).toEqual('masuk'); // Two days ago transaction
    expect(result[2].jumlah).toEqual(50);

    // Verify all transactions belong to the correct barang
    result.forEach(transaksi => {
      expect(transaksi.barang_id).toEqual(barang.id);
      expect(transaksi.nama_barang).toEqual(barang.nama);
      expect(transaksi.id).toBeDefined();
      expect(transaksi.created_at).toBeInstanceOf(Date);
      expect(transaksi.tanggal_transaksi).toBeInstanceOf(Date);
    });
  });

  it('should not return transactions from other barang', async () => {
    // Create two different barang
    const barang1Result = await db.insert(barangTable)
      .values({
        nama: 'Barang 1',
        kode: 'B001',
        jumlah_stok: 100,
        deskripsi: 'Barang pertama'
      })
      .returning()
      .execute();

    const barang2Result = await db.insert(barangTable)
      .values({
        nama: 'Barang 2',
        kode: 'B002',
        jumlah_stok: 200,
        deskripsi: 'Barang kedua'
      })
      .returning()
      .execute();

    const barang1 = barang1Result[0];
    const barang2 = barang2Result[0];

    // Create transactions for both barang
    await db.insert(transaksiTable)
      .values([
        {
          jenis: 'masuk',
          barang_id: barang1.id,
          nama_barang: barang1.nama,
          jumlah: 50,
          tanggal_transaksi: new Date()
        },
        {
          jenis: 'keluar',
          barang_id: barang2.id,
          nama_barang: barang2.nama,
          jumlah: 30,
          tanggal_transaksi: new Date()
        },
        {
          jenis: 'masuk',
          barang_id: barang1.id,
          nama_barang: barang1.nama,
          jumlah: 25,
          tanggal_transaksi: new Date()
        }
      ])
      .execute();

    const input: GetTransaksiByBarangIdInput = {
      barang_id: barang1.id
    };

    const result = await getTransaksiByBarangId(input);

    // Should return only transactions for barang1
    expect(result).toHaveLength(2);
    result.forEach(transaksi => {
      expect(transaksi.barang_id).toEqual(barang1.id);
      expect(transaksi.nama_barang).toEqual('Barang 1');
    });
  });

  it('should return empty array for non-existent barang ID', async () => {
    const input: GetTransaksiByBarangIdInput = {
      barang_id: 999999 // Non-existent ID
    };

    const result = await getTransaksiByBarangId(input);

    expect(result).toEqual([]);
  });

  it('should handle various transaction types and amounts correctly', async () => {
    // Create a barang
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Multi Transaction Barang',
        kode: 'MTB001',
        jumlah_stok: 1000,
        deskripsi: 'Barang dengan banyak transaksi'
      })
      .returning()
      .execute();

    const barang = barangResult[0];

    // Create transactions with different types and amounts
    await db.insert(transaksiTable)
      .values([
        {
          jenis: 'masuk',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 100,
          tanggal_transaksi: new Date()
        },
        {
          jenis: 'keluar',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 1,
          tanggal_transaksi: new Date()
        },
        {
          jenis: 'masuk',
          barang_id: barang.id,
          nama_barang: barang.nama,
          jumlah: 500,
          tanggal_transaksi: new Date()
        }
      ])
      .execute();

    const input: GetTransaksiByBarangIdInput = {
      barang_id: barang.id
    };

    const result = await getTransaksiByBarangId(input);

    expect(result).toHaveLength(3);

    // Verify different transaction types exist
    const masukTransaksi = result.filter(t => t.jenis === 'masuk');
    const keluarTransaksi = result.filter(t => t.jenis === 'keluar');
    
    expect(masukTransaksi).toHaveLength(2);
    expect(keluarTransaksi).toHaveLength(1);

    // Verify all amounts are preserved correctly
    const amounts = result.map(t => t.jumlah).sort((a, b) => a - b);
    expect(amounts).toEqual([1, 100, 500]);
  });
});
