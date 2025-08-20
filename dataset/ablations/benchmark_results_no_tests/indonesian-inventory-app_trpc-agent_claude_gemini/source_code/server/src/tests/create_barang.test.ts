import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { createBarang } from '../handlers/create_barang';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBarangInput = {
  nama: 'Test Barang',
  kode: 'TEST001',
  jumlah_stok: 50,
  deskripsi: 'Barang untuk testing'
};

// Test input with null description
const testInputWithoutDescription: CreateBarangInput = {
  nama: 'Barang Tanpa Deskripsi',
  kode: 'TEST002',
  jumlah_stok: 25,
  deskripsi: null
};

// Test input with zero stock
const testInputZeroStock: CreateBarangInput = {
  nama: 'Barang Stok Nol',
  kode: 'TEST003',
  jumlah_stok: 0,
  deskripsi: 'Barang dengan stok nol'
};

describe('createBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a barang with complete data', async () => {
    const result = await createBarang(testInput);

    // Verify all fields are correctly set
    expect(result.nama).toEqual('Test Barang');
    expect(result.kode).toEqual('TEST001');
    expect(result.jumlah_stok).toEqual(50);
    expect(result.deskripsi).toEqual('Barang untuk testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a barang with null description', async () => {
    const result = await createBarang(testInputWithoutDescription);

    expect(result.nama).toEqual('Barang Tanpa Deskripsi');
    expect(result.kode).toEqual('TEST002');
    expect(result.jumlah_stok).toEqual(25);
    expect(result.deskripsi).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a barang with zero stock', async () => {
    const result = await createBarang(testInputZeroStock);

    expect(result.nama).toEqual('Barang Stok Nol');
    expect(result.kode).toEqual('TEST003');
    expect(result.jumlah_stok).toEqual(0);
    expect(result.deskripsi).toEqual('Barang dengan stok nol');
    expect(result.id).toBeDefined();
  });

  it('should save barang to database correctly', async () => {
    const result = await createBarang(testInput);

    // Query database to verify data was saved
    const savedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(savedBarang).toHaveLength(1);
    expect(savedBarang[0].nama).toEqual('Test Barang');
    expect(savedBarang[0].kode).toEqual('TEST001');
    expect(savedBarang[0].jumlah_stok).toEqual(50);
    expect(savedBarang[0].deskripsi).toEqual('Barang untuk testing');
    expect(savedBarang[0].created_at).toBeInstanceOf(Date);
    expect(savedBarang[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when kode already exists', async () => {
    // Create first barang
    await createBarang(testInput);

    // Try to create another barang with same kode
    const duplicateInput: CreateBarangInput = {
      nama: 'Duplicate Barang',
      kode: 'TEST001', // Same kode as testInput
      jumlah_stok: 100,
      deskripsi: 'This should fail'
    };

    await expect(createBarang(duplicateInput))
      .rejects.toThrow(/sudah ada/i);
  });

  it('should allow different kode values', async () => {
    // Create multiple barang with different kode values
    const result1 = await createBarang(testInput);
    const result2 = await createBarang(testInputWithoutDescription);
    const result3 = await createBarang(testInputZeroStock);

    // All should succeed
    expect(result1.kode).toEqual('TEST001');
    expect(result2.kode).toEqual('TEST002');
    expect(result3.kode).toEqual('TEST003');

    // Verify all are saved in database
    const allBarang = await db.select()
      .from(barangTable)
      .execute();

    expect(allBarang).toHaveLength(3);
    
    const kodes = allBarang.map(b => b.kode).sort();
    expect(kodes).toEqual(['TEST001', 'TEST002', 'TEST003']);
  });

  it('should preserve exact input values in database', async () => {
    const preciseInput: CreateBarangInput = {
      nama: 'Barang Dengan Spasi   Dan Karakter !@#$%',
      kode: 'COMPLEX-CODE_123',
      jumlah_stok: 999,
      deskripsi: 'Deskripsi dengan\nnewline dan "quotes"'
    };

    const result = await createBarang(preciseInput);

    // Verify exact values are preserved
    expect(result.nama).toEqual(preciseInput.nama);
    expect(result.kode).toEqual(preciseInput.kode);
    expect(result.jumlah_stok).toEqual(preciseInput.jumlah_stok);
    expect(result.deskripsi).toEqual(preciseInput.deskripsi);

    // Also verify in database
    const dbResult = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(dbResult[0].nama).toEqual(preciseInput.nama);
    expect(dbResult[0].deskripsi).toEqual(preciseInput.deskripsi);
  });
});
