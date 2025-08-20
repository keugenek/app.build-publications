import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { createBarang } from '../handlers/create_barang';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateBarangInput = {
  nama_barang: 'Test Barang',
  kode_sku: 'TEST-001',
  jumlah_stok: 50
};

describe('createBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a barang', async () => {
    const result = await createBarang(testInput);

    // Basic field validation
    expect(result.nama_barang).toEqual('Test Barang');
    expect(result.kode_sku).toEqual('TEST-001');
    expect(result.jumlah_stok).toEqual(50);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save barang to database', async () => {
    const result = await createBarang(testInput);

    // Query using proper drizzle syntax
    const barang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, result.id))
      .execute();

    expect(barang).toHaveLength(1);
    expect(barang[0].nama_barang).toEqual('Test Barang');
    expect(barang[0].kode_sku).toEqual('TEST-001');
    expect(barang[0].jumlah_stok).toEqual(50);
    expect(barang[0].created_at).toBeInstanceOf(Date);
    expect(barang[0].updated_at).toBeInstanceOf(Date);
  });

  it('should apply default jumlah_stok when not provided', async () => {
    const inputWithoutStock: CreateBarangInput = {
      nama_barang: 'Default Stock Item',
      kode_sku: 'DEFAULT-001',
      jumlah_stok: 0 // Zod default is applied
    };

    const result = await createBarang(inputWithoutStock);

    expect(result.jumlah_stok).toEqual(0);

    // Verify in database
    const barang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'DEFAULT-001'))
      .execute();

    expect(barang[0].jumlah_stok).toEqual(0);
  });

  it('should throw error when kode_sku already exists', async () => {
    // Create first barang
    await createBarang(testInput);

    // Try to create another barang with same kode_sku
    const duplicateInput: CreateBarangInput = {
      nama_barang: 'Duplicate SKU Item',
      kode_sku: 'TEST-001', // Same SKU
      jumlah_stok: 25
    };

    await expect(createBarang(duplicateInput)).rejects.toThrow(/Kode SKU 'TEST-001' sudah ada/i);
  });

  it('should handle different valid inputs correctly', async () => {
    const inputs: CreateBarangInput[] = [
      {
        nama_barang: 'Laptop Gaming',
        kode_sku: 'LAP-001',
        jumlah_stok: 15
      },
      {
        nama_barang: 'Mouse Wireless',
        kode_sku: 'MSE-WRL-002',
        jumlah_stok: 100
      },
      {
        nama_barang: 'Keyboard Mechanical',
        kode_sku: 'KBD-MCH-003',
        jumlah_stok: 0
      }
    ];

    for (const input of inputs) {
      const result = await createBarang(input);

      expect(result.nama_barang).toEqual(input.nama_barang);
      expect(result.kode_sku).toEqual(input.kode_sku);
      expect(result.jumlah_stok).toEqual(input.jumlah_stok);
      expect(result.id).toBeDefined();
    }

    // Verify all items are in database
    const allBarang = await db.select()
      .from(barangTable)
      .execute();

    expect(allBarang).toHaveLength(3);
    
    // Verify unique kode_sku constraint
    const skuCodes = allBarang.map(b => b.kode_sku);
    const uniqueSkus = new Set(skuCodes);
    expect(uniqueSkus.size).toEqual(3); // All SKUs should be unique
  });

  it('should query barang by kode_sku correctly', async () => {
    // Create test barang
    await createBarang(testInput);

    // Query by SKU - demonstration of correct SKU querying
    const barangBySku = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'TEST-001'))
      .execute();

    expect(barangBySku).toHaveLength(1);
    expect(barangBySku[0].nama_barang).toEqual('Test Barang');
    expect(barangBySku[0].kode_sku).toEqual('TEST-001');
    expect(barangBySku[0].jumlah_stok).toEqual(50);

    // Test non-existent SKU
    const nonExistentSku = await db.select()
      .from(barangTable)
      .where(eq(barangTable.kode_sku, 'NON-EXIST'))
      .execute();

    expect(nonExistentSku).toHaveLength(0);
  });
});
