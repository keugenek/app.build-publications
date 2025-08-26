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
  kode_barang: 'TB001',
  deskripsi: 'Barang untuk testing',
  harga: 150000.50,
  stok: 25
};

// Minimal input testing Zod defaults
const minimalInput: CreateBarangInput = {
  nama: 'Minimal Barang',
  kode_barang: 'MB001',
  deskripsi: null,
  harga: 75000,
  stok: 0
};

describe('createBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a barang with complete data', async () => {
    const result = await createBarang(testInput);

    // Validate all fields are correctly set
    expect(result.nama).toEqual('Test Barang');
    expect(result.kode_barang).toEqual('TB001');
    expect(result.deskripsi).toEqual('Barang untuk testing');
    expect(result.harga).toEqual(150000.50);
    expect(typeof result.harga).toBe('number'); // Verify numeric conversion
    expect(result.stok).toEqual(25);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a barang with minimal data and apply defaults', async () => {
    const result = await createBarang(minimalInput);

    expect(result.nama).toEqual('Minimal Barang');
    expect(result.kode_barang).toEqual('MB001');
    expect(result.deskripsi).toBeNull();
    expect(result.harga).toEqual(75000);
    expect(typeof result.harga).toBe('number');
    expect(result.stok).toEqual(0); // Default value applied
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
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
    expect(savedBarang[0].kode_barang).toEqual('TB001');
    expect(savedBarang[0].deskripsi).toEqual('Barang untuk testing');
    expect(parseFloat(savedBarang[0].harga)).toEqual(150000.50); // Verify numeric conversion from DB
    expect(savedBarang[0].stok).toEqual(25);
    expect(savedBarang[0].created_at).toBeInstanceOf(Date);
    expect(savedBarang[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate kode_barang', async () => {
    // Create first barang
    await createBarang(testInput);

    // Attempt to create second barang with same kode_barang
    const duplicateInput: CreateBarangInput = {
      nama: 'Duplicate Test',
      kode_barang: 'TB001', // Same kode_barang
      deskripsi: 'Should fail',
      harga: 100000,
      stok: 10
    };

    await expect(createBarang(duplicateInput))
      .rejects
      .toThrow(/kode.*sudah ada/i);
  });

  it('should handle different kode_barang values correctly', async () => {
    // Create multiple barang with different kode_barang
    const barang1 = await createBarang(testInput);
    
    const input2: CreateBarangInput = {
      nama: 'Second Barang',
      kode_barang: 'TB002', // Different kode_barang
      deskripsi: 'Second test item',
      harga: 200000,
      stok: 50
    };
    
    const barang2 = await createBarang(input2);

    // Both should be created successfully
    expect(barang1.kode_barang).toEqual('TB001');
    expect(barang2.kode_barang).toEqual('TB002');
    expect(barang1.id).not.toEqual(barang2.id);

    // Verify both exist in database
    const allBarang = await db.select()
      .from(barangTable)
      .execute();

    expect(allBarang).toHaveLength(2);
    expect(allBarang.some(b => b.kode_barang === 'TB001')).toBe(true);
    expect(allBarang.some(b => b.kode_barang === 'TB002')).toBe(true);
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateBarangInput = {
      nama: 'Precision Test',
      kode_barang: 'PT001',
      deskripsi: 'Testing decimal precision',
      harga: 1234.99, // Test decimal precision
      stok: 100
    };

    const result = await createBarang(precisionInput);

    expect(result.harga).toEqual(1234.99);
    expect(typeof result.harga).toBe('number');

    // Verify precision is maintained in database
    const savedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(parseFloat(savedBarang[0].harga)).toEqual(1234.99);
  });

  it('should handle zero values correctly', async () => {
    const zeroInput: CreateBarangInput = {
      nama: 'Zero Test',
      kode_barang: 'ZT001',
      deskripsi: 'Testing zero values',
      harga: 0, // Zero price
      stok: 0   // Zero stock
    };

    const result = await createBarang(zeroInput);

    expect(result.harga).toEqual(0);
    expect(result.stok).toEqual(0);
    expect(typeof result.harga).toBe('number');
  });
});
