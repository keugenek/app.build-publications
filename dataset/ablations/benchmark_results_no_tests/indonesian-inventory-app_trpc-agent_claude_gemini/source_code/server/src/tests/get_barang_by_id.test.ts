import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangByIdInput } from '../schema';
import { getBarangById } from '../handlers/get_barang_by_id';

// Test data for barang
const testBarang = {
  nama: 'Test Item',
  kode: 'TEST001',
  jumlah_stok: 50,
  deskripsi: 'A test inventory item'
};

const testBarangWithNullDesc = {
  nama: 'Test Item 2',
  kode: 'TEST002',
  jumlah_stok: 25,
  deskripsi: null
};

describe('getBarangById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return barang when found', async () => {
    // Create test barang
    const insertResults = await db.insert(barangTable)
      .values(testBarang)
      .returning()
      .execute();

    const createdBarang = insertResults[0];
    const input: GetBarangByIdInput = { id: createdBarang.id };

    // Test the handler
    const result = await getBarangById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBarang.id);
    expect(result!.nama).toEqual('Test Item');
    expect(result!.kode).toEqual('TEST001');
    expect(result!.jumlah_stok).toEqual(50);
    expect(result!.deskripsi).toEqual('A test inventory item');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when barang not found', async () => {
    const input: GetBarangByIdInput = { id: 999 };

    const result = await getBarangById(input);

    expect(result).toBeNull();
  });

  it('should handle barang with null description', async () => {
    // Create test barang with null description
    const insertResults = await db.insert(barangTable)
      .values(testBarangWithNullDesc)
      .returning()
      .execute();

    const createdBarang = insertResults[0];
    const input: GetBarangByIdInput = { id: createdBarang.id };

    // Test the handler
    const result = await getBarangById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBarang.id);
    expect(result!.nama).toEqual('Test Item 2');
    expect(result!.kode).toEqual('TEST002');
    expect(result!.jumlah_stok).toEqual(25);
    expect(result!.deskripsi).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct barang when multiple barang exist', async () => {
    // Create multiple test barang
    const insertResults = await db.insert(barangTable)
      .values([testBarang, testBarangWithNullDesc])
      .returning()
      .execute();

    const firstBarang = insertResults[0];
    const secondBarang = insertResults[1];

    // Test getting first barang
    const firstInput: GetBarangByIdInput = { id: firstBarang.id };
    const firstResult = await getBarangById(firstInput);

    expect(firstResult).not.toBeNull();
    expect(firstResult!.id).toEqual(firstBarang.id);
    expect(firstResult!.nama).toEqual('Test Item');
    expect(firstResult!.kode).toEqual('TEST001');

    // Test getting second barang
    const secondInput: GetBarangByIdInput = { id: secondBarang.id };
    const secondResult = await getBarangById(secondInput);

    expect(secondResult).not.toBeNull();
    expect(secondResult!.id).toEqual(secondBarang.id);
    expect(secondResult!.nama).toEqual('Test Item 2');
    expect(secondResult!.kode).toEqual('TEST002');
    expect(secondResult!.deskripsi).toBeNull();
  });

  it('should handle zero stock quantity correctly', async () => {
    // Create barang with zero stock
    const zeroStockBarang = {
      nama: 'Zero Stock Item',
      kode: 'ZERO001',
      jumlah_stok: 0,
      deskripsi: 'Item with zero stock'
    };

    const insertResults = await db.insert(barangTable)
      .values(zeroStockBarang)
      .returning()
      .execute();

    const createdBarang = insertResults[0];
    const input: GetBarangByIdInput = { id: createdBarang.id };

    const result = await getBarangById(input);

    expect(result).not.toBeNull();
    expect(result!.jumlah_stok).toEqual(0);
    expect(typeof result!.jumlah_stok).toBe('number');
  });
});
