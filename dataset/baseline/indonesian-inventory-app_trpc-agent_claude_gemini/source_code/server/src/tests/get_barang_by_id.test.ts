import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type GetBarangByIdInput, type CreateBarangInput } from '../schema';
import { getBarangById } from '../handlers/get_barang_by_id';
import { eq } from 'drizzle-orm';

// Test input for creating a barang
const testBarangInput: CreateBarangInput = {
  nama: 'Test Barang',
  kode_barang: 'TB001',
  deskripsi: 'Barang untuk testing',
  harga: 15000.75,
  stok: 50
};

// Test input for getting barang by ID
const validGetInput: GetBarangByIdInput = {
  id: 1
};

const invalidGetInput: GetBarangByIdInput = {
  id: 999
};

describe('getBarangById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return barang when ID exists', async () => {
    // Create a test barang first
    const insertResult = await db.insert(barangTable)
      .values({
        nama: testBarangInput.nama,
        kode_barang: testBarangInput.kode_barang,
        deskripsi: testBarangInput.deskripsi,
        harga: testBarangInput.harga.toString(), // Convert to string for database
        stok: testBarangInput.stok
      })
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Test getting the barang by ID
    const result = await getBarangById({ id: createdId });

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdId);
    expect(result!.nama).toBe('Test Barang');
    expect(result!.kode_barang).toBe('TB001');
    expect(result!.deskripsi).toBe('Barang untuk testing');
    expect(result!.harga).toBe(15000.75); // Should be converted back to number
    expect(typeof result!.harga).toBe('number');
    expect(result!.stok).toBe(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    const result = await getBarangById(invalidGetInput);

    expect(result).toBeNull();
  });

  it('should handle different barang data correctly', async () => {
    // Create multiple barang with different data
    const barang1 = await db.insert(barangTable)
      .values({
        nama: 'Barang Pertama',
        kode_barang: 'BP001',
        deskripsi: null, // Test null description
        harga: '100.00',
        stok: 10
      })
      .returning()
      .execute();

    const barang2 = await db.insert(barangTable)
      .values({
        nama: 'Barang Kedua',
        kode_barang: 'BP002',
        deskripsi: 'Deskripsi barang kedua',
        harga: '999.99',
        stok: 0 // Test zero stock
      })
      .returning()
      .execute();

    // Test first barang
    const result1 = await getBarangById({ id: barang1[0].id });
    expect(result1).not.toBeNull();
    expect(result1!.nama).toBe('Barang Pertama');
    expect(result1!.deskripsi).toBeNull();
    expect(result1!.harga).toBe(100.00);
    expect(result1!.stok).toBe(10);

    // Test second barang
    const result2 = await getBarangById({ id: barang2[0].id });
    expect(result2).not.toBeNull();
    expect(result2!.nama).toBe('Barang Kedua');
    expect(result2!.deskripsi).toBe('Deskripsi barang kedua');
    expect(result2!.harga).toBe(999.99);
    expect(result2!.stok).toBe(0);
  });

  it('should verify barang exists in database after retrieval', async () => {
    // Create a barang
    const insertResult = await db.insert(barangTable)
      .values({
        nama: 'Verification Test',
        kode_barang: 'VT001',
        deskripsi: 'Test for database verification',
        harga: '50.25',
        stok: 25
      })
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get barang via handler
    const handlerResult = await getBarangById({ id: createdId });

    // Verify by direct database query
    const directQuery = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, createdId))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(directQuery).toHaveLength(1);
    expect(handlerResult!.id).toBe(directQuery[0].id);
    expect(handlerResult!.nama).toBe(directQuery[0].nama);
    expect(handlerResult!.kode_barang).toBe(directQuery[0].kode_barang);
    expect(handlerResult!.harga).toBe(parseFloat(directQuery[0].harga));
  });
});
