import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable, transaksiTable } from '../db/schema';
import { type GetTransaksiByBarangInput } from '../schema';
import { getTransaksiByBarang } from '../handlers/get_transaksi_by_barang';
import { eq } from 'drizzle-orm';

describe('getTransaksiByBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist for barang', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Item',
        kode_barang: 'TEST001',
        deskripsi: 'Test description',
        harga: '100.00',
        stok: 10
      })
      .returning()
      .execute();

    const input: GetTransaksiByBarangInput = {
      barang_id: barangResult[0].id
    };

    const result = await getTransaksiByBarang(input);

    expect(result).toEqual([]);
  });

  it('should return transactions with barang details ordered by tanggal descending', async () => {
    // Create a barang first
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Test Product',
        kode_barang: 'PROD001',
        deskripsi: 'A test product',
        harga: '25.50',
        stok: 50
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create multiple transactions with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(transaksiTable)
      .values([
        {
          tanggal: twoDaysAgo,
          barang_id: barangId,
          jenis: 'MASUK',
          jumlah: 20,
          keterangan: 'Stock in - oldest'
        },
        {
          tanggal: today,
          barang_id: barangId,
          jenis: 'KELUAR',
          jumlah: 5,
          keterangan: 'Sale - newest'
        },
        {
          tanggal: yesterday,
          barang_id: barangId,
          jenis: 'MASUK',
          jumlah: 10,
          keterangan: 'Restock - middle'
        }
      ])
      .execute();

    const input: GetTransaksiByBarangInput = {
      barang_id: barangId
    };

    const result = await getTransaksiByBarang(input);

    // Should return 3 transactions
    expect(result).toHaveLength(3);

    // Should be ordered by tanggal descending (newest first)
    expect(result[0].keterangan).toEqual('Sale - newest');
    expect(result[1].keterangan).toEqual('Restock - middle');
    expect(result[2].keterangan).toEqual('Stock in - oldest');

    // Verify transaction fields
    expect(result[0].jenis).toEqual('KELUAR');
    expect(result[0].jumlah).toEqual(5);
    expect(result[0].barang_id).toEqual(barangId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify barang details are included and properly converted
    result.forEach(transaction => {
      expect(transaction.barang).toBeDefined();
      expect(transaction.barang.id).toEqual(barangId);
      expect(transaction.barang.nama).toEqual('Test Product');
      expect(transaction.barang.kode_barang).toEqual('PROD001');
      expect(transaction.barang.deskripsi).toEqual('A test product');
      expect(transaction.barang.harga).toEqual(25.50); // Numeric conversion
      expect(typeof transaction.barang.harga).toEqual('number');
      expect(transaction.barang.stok).toEqual(50);
      expect(transaction.barang.created_at).toBeInstanceOf(Date);
      expect(transaction.barang.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return transactions for the specified barang', async () => {
    // Create two different barang
    const barang1Result = await db.insert(barangTable)
      .values({
        nama: 'Product A',
        kode_barang: 'PROD_A',
        deskripsi: 'First product',
        harga: '10.00',
        stok: 20
      })
      .returning()
      .execute();

    const barang2Result = await db.insert(barangTable)
      .values({
        nama: 'Product B',
        kode_barang: 'PROD_B',
        deskripsi: 'Second product',
        harga: '20.00',
        stok: 30
      })
      .returning()
      .execute();

    const barang1Id = barang1Result[0].id;
    const barang2Id = barang2Result[0].id;

    // Create transactions for both barang
    await db.insert(transaksiTable)
      .values([
        {
          tanggal: new Date(),
          barang_id: barang1Id,
          jenis: 'MASUK',
          jumlah: 5,
          keterangan: 'Transaction for Product A'
        },
        {
          tanggal: new Date(),
          barang_id: barang2Id,
          jenis: 'KELUAR',
          jumlah: 3,
          keterangan: 'Transaction for Product B'
        },
        {
          tanggal: new Date(),
          barang_id: barang1Id,
          jenis: 'KELUAR',
          jumlah: 2,
          keterangan: 'Another transaction for Product A'
        }
      ])
      .execute();

    const input: GetTransaksiByBarangInput = {
      barang_id: barang1Id
    };

    const result = await getTransaksiByBarang(input);

    // Should only return transactions for barang1
    expect(result).toHaveLength(2);
    
    result.forEach(transaction => {
      expect(transaction.barang_id).toEqual(barang1Id);
      expect(transaction.barang.nama).toEqual('Product A');
      expect(transaction.keterangan).toContain('Product A');
    });
  });

  it('should handle barang with null deskripsi correctly', async () => {
    // Create barang with null description
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Simple Item',
        kode_barang: 'SIMPLE01',
        deskripsi: null,
        harga: '15.75',
        stok: 5
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create transaction
    await db.insert(transaksiTable)
      .values({
        tanggal: new Date(),
        barang_id: barangId,
        jenis: 'MASUK',
        jumlah: 10,
        keterangan: null
      })
      .execute();

    const input: GetTransaksiByBarangInput = {
      barang_id: barangId
    };

    const result = await getTransaksiByBarang(input);

    expect(result).toHaveLength(1);
    expect(result[0].barang.deskripsi).toBeNull();
    expect(result[0].keterangan).toBeNull();
    expect(result[0].barang.harga).toEqual(15.75);
  });

  it('should return empty array for non-existent barang', async () => {
    const input: GetTransaksiByBarangInput = {
      barang_id: 99999 // Non-existent ID
    };

    const result = await getTransaksiByBarang(input);

    expect(result).toEqual([]);
  });

  it('should verify transactions exist in database after query', async () => {
    // Create barang
    const barangResult = await db.insert(barangTable)
      .values({
        nama: 'Verify Item',
        kode_barang: 'VERIFY01',
        deskripsi: 'Item for verification',
        harga: '30.00',
        stok: 15
      })
      .returning()
      .execute();

    const barangId = barangResult[0].id;

    // Create transaction
    await db.insert(transaksiTable)
      .values({
        tanggal: new Date(),
        barang_id: barangId,
        jenis: 'MASUK',
        jumlah: 25,
        keterangan: 'Verification transaction'
      })
      .execute();

    const input: GetTransaksiByBarangInput = {
      barang_id: barangId
    };

    const result = await getTransaksiByBarang(input);

    // Verify transaction exists in database
    const dbTransactions = await db.select()
      .from(transaksiTable)
      .where(eq(transaksiTable.barang_id, barangId))
      .execute();

    expect(dbTransactions).toHaveLength(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(dbTransactions[0].id);
    expect(result[0].jumlah).toEqual(dbTransactions[0].jumlah);
  });
});
