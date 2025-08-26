import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangBySkuInput } from '../schema';
import { getBarangBySku } from '../handlers/get_barang_by_sku';

// Test setup data
const testBarang = {
  nama_barang: 'Test Item',
  kode_sku: 'TEST-001',
  jumlah_stok: 50
};

const anotherBarang = {
  nama_barang: 'Another Item',
  kode_sku: 'TEST-002',
  jumlah_stok: 25
};

describe('getBarangBySku', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return barang when SKU exists', async () => {
    // Create test barang
    const insertResult = await db.insert(barangTable)
      .values(testBarang)
      .returning()
      .execute();

    const createdBarang = insertResult[0];

    // Test the handler
    const input: GetBarangBySkuInput = {
      kode_sku: 'TEST-001'
    };

    const result = await getBarangBySku(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBarang.id);
    expect(result!.nama_barang).toEqual('Test Item');
    expect(result!.kode_sku).toEqual('TEST-001');
    expect(result!.jumlah_stok).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when SKU does not exist', async () => {
    // Create some test data but query for non-existent SKU
    await db.insert(barangTable)
      .values(testBarang)
      .execute();

    const input: GetBarangBySkuInput = {
      kode_sku: 'NON-EXISTENT'
    };

    const result = await getBarangBySku(input);

    expect(result).toBeNull();
  });

  it('should return correct barang when multiple items exist', async () => {
    // Create multiple test barang
    await db.insert(barangTable)
      .values([testBarang, anotherBarang])
      .execute();

    // Query for specific SKU
    const input: GetBarangBySkuInput = {
      kode_sku: 'TEST-002'
    };

    const result = await getBarangBySku(input);

    // Should return the correct barang
    expect(result).not.toBeNull();
    expect(result!.nama_barang).toEqual('Another Item');
    expect(result!.kode_sku).toEqual('TEST-002');
    expect(result!.jumlah_stok).toEqual(25);
  });

  it('should handle SKU case sensitivity correctly', async () => {
    // Create test barang
    await db.insert(barangTable)
      .values(testBarang)
      .execute();

    // Test with different case
    const input: GetBarangBySkuInput = {
      kode_sku: 'test-001' // lowercase
    };

    const result = await getBarangBySku(input);

    // Should not find the item (case sensitive)
    expect(result).toBeNull();
  });

  it('should handle empty database correctly', async () => {
    // Don't create any test data
    const input: GetBarangBySkuInput = {
      kode_sku: 'ANY-SKU'
    };

    const result = await getBarangBySku(input);

    expect(result).toBeNull();
  });

  it('should validate that returned barang has all required fields', async () => {
    // Create test barang with all fields
    const completeBarang = {
      nama_barang: 'Complete Item',
      kode_sku: 'COMPLETE-001',
      jumlah_stok: 100
    };

    await db.insert(barangTable)
      .values(completeBarang)
      .execute();

    const input: GetBarangBySkuInput = {
      kode_sku: 'COMPLETE-001'
    };

    const result = await getBarangBySku(input);

    // Verify all required fields are present and have correct types
    expect(result).not.toBeNull();
    expect(typeof result!.id).toEqual('number');
    expect(typeof result!.nama_barang).toEqual('string');
    expect(typeof result!.kode_sku).toEqual('string');
    expect(typeof result!.jumlah_stok).toEqual('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify field values
    expect(result!.nama_barang).toEqual('Complete Item');
    expect(result!.kode_sku).toEqual('COMPLETE-001');
    expect(result!.jumlah_stok).toEqual(100);
  });
});
