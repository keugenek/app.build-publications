import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { createBarang } from '../handlers/create_barang';
import { eq } from 'drizzle-orm';

// Test inputs
const basicTestInput: CreateBarangInput = {
  nama_barang: 'Test Barang',
  kode_barang: 'TB001',
  deskripsi: 'A test barang item',
  harga_beli: 15000.50,
  harga_jual: 20000.75
};

const minimalTestInput: CreateBarangInput = {
  nama_barang: 'Minimal Barang',
  kode_barang: 'MIN001'
};

const withNullValuesInput: CreateBarangInput = {
  nama_barang: 'Null Values Barang',
  kode_barang: 'NULL001',
  deskripsi: null,
  harga_beli: null,
  harga_jual: null
};

describe('createBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a barang with all fields', async () => {
    const result = await createBarang(basicTestInput);

    // Basic field validation
    expect(result.nama_barang).toEqual('Test Barang');
    expect(result.kode_barang).toEqual('TB001');
    expect(result.deskripsi).toEqual('A test barang item');
    expect(result.jumlah_stok).toEqual(0);
    expect(result.harga_beli).toEqual(15000.50);
    expect(result.harga_jual).toEqual(20000.75);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.harga_beli).toBe('number');
    expect(typeof result.harga_jual).toBe('number');
  });

  it('should create a barang with minimal required fields', async () => {
    const result = await createBarang(minimalTestInput);

    expect(result.nama_barang).toEqual('Minimal Barang');
    expect(result.kode_barang).toEqual('MIN001');
    expect(result.deskripsi).toBeNull();
    expect(result.jumlah_stok).toEqual(0);
    expect(result.harga_beli).toBeNull();
    expect(result.harga_jual).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a barang with explicitly null values', async () => {
    const result = await createBarang(withNullValuesInput);

    expect(result.nama_barang).toEqual('Null Values Barang');
    expect(result.kode_barang).toEqual('NULL001');
    expect(result.deskripsi).toBeNull();
    expect(result.harga_beli).toBeNull();
    expect(result.harga_jual).toBeNull();
    expect(result.jumlah_stok).toEqual(0);
  });

  it('should save barang to database correctly', async () => {
    const result = await createBarang(basicTestInput);

    // Query database to verify saved data
    const barangList = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(barangList).toHaveLength(1);
    const savedBarang = barangList[0];
    
    expect(savedBarang.nama_barang).toEqual('Test Barang');
    expect(savedBarang.kode_barang).toEqual('TB001');
    expect(savedBarang.deskripsi).toEqual('A test barang item');
    expect(savedBarang.jumlah_stok).toEqual(0);
    expect(parseFloat(savedBarang.harga_beli!)).toEqual(15000.50);
    expect(parseFloat(savedBarang.harga_jual!)).toEqual(20000.75);
    expect(savedBarang.created_at).toBeInstanceOf(Date);
    expect(savedBarang.updated_at).toBeInstanceOf(Date);
  });

  it('should enforce kode_barang uniqueness', async () => {
    // Create first barang
    await createBarang(basicTestInput);

    // Try to create another barang with same kode_barang
    const duplicateInput: CreateBarangInput = {
      nama_barang: 'Duplicate Barang',
      kode_barang: 'TB001' // Same as basicTestInput
    };

    await expect(createBarang(duplicateInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should handle different kode_barang values correctly', async () => {
    // Create multiple barang with different codes
    const inputs = [
      { ...basicTestInput, kode_barang: 'UNIQUE001' },
      { ...basicTestInput, kode_barang: 'UNIQUE002' },
      { ...basicTestInput, kode_barang: 'UNIQUE003' }
    ];

    const results = await Promise.all(
      inputs.map(input => createBarang(input))
    );

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.kode_barang).toEqual(`UNIQUE00${index + 1}`);
      expect(result.id).toBeDefined();
    });

    // Verify all are saved in database
    const allBarang = await db.select()
      .from(barangTable)
      .execute();

    expect(allBarang.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateBarangInput = {
      nama_barang: 'Precision Test',
      kode_barang: 'PREC001',
      harga_beli: 12345.67,
      harga_jual: 98765.43
    };

    const result = await createBarang(precisionInput);

    expect(result.harga_beli).toEqual(12345.67);
    expect(result.harga_jual).toEqual(98765.43);

    // Verify precision is maintained in database
    const saved = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].harga_beli!)).toEqual(12345.67);
    expect(parseFloat(saved[0].harga_jual!)).toEqual(98765.43);
  });

  it('should always set initial jumlah_stok to 0', async () => {
    const inputs = [basicTestInput, minimalTestInput, withNullValuesInput];

    const results = await Promise.all(
      inputs.map((input, index) => 
        createBarang({
          ...input,
          kode_barang: `STOCK00${index + 1}`
        })
      )
    );

    results.forEach(result => {
      expect(result.jumlah_stok).toEqual(0);
    });
  });
});
