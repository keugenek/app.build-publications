import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput, type UpdateBarangInput } from '../schema';
import { updateBarang } from '../handlers/update_barang';
import { eq } from 'drizzle-orm';

// Helper function to create a test barang
async function createTestBarang(input: CreateBarangInput) {
  const result = await db.insert(barangTable)
    .values({
      nama: input.nama,
      kode_barang: input.kode_barang,
      deskripsi: input.deskripsi,
      harga: input.harga.toString(),
      stok: input.stok
    })
    .returning()
    .execute();

  return {
    ...result[0],
    harga: parseFloat(result[0].harga)
  };
}

// Test data
const testBarang: CreateBarangInput = {
  nama: 'Test Barang Original',
  kode_barang: 'TEST001',
  deskripsi: 'Original description',
  harga: 15000,
  stok: 50
};

const anotherBarang: CreateBarangInput = {
  nama: 'Another Barang',
  kode_barang: 'ANOTHER001',
  deskripsi: 'Another description',
  harga: 25000,
  stok: 30
};

describe('updateBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a barang', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      nama: 'Updated Barang Name',
      kode_barang: 'UPDATED001',
      deskripsi: 'Updated description',
      harga: 20000,
      stok: 75
    };

    const result = await updateBarang(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(created.id);
    expect(result.nama).toEqual('Updated Barang Name');
    expect(result.kode_barang).toEqual('UPDATED001');
    expect(result.deskripsi).toEqual('Updated description');
    expect(result.harga).toEqual(20000);
    expect(typeof result.harga).toBe('number');
    expect(result.stok).toEqual(75);
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      nama: 'Partially Updated Name',
      harga: 18000
    };

    const result = await updateBarang(updateInput);

    // Verify only specified fields are updated
    expect(result.nama).toEqual('Partially Updated Name');
    expect(result.harga).toEqual(18000);
    // Other fields should remain unchanged
    expect(result.kode_barang).toEqual(testBarang.kode_barang);
    expect(result.deskripsi).toEqual(testBarang.deskripsi);
    expect(result.stok).toEqual(testBarang.stok);
  });

  it('should update deskripsi to null', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      deskripsi: null
    };

    const result = await updateBarang(updateInput);

    expect(result.deskripsi).toBeNull();
  });

  it('should save updated barang to database', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      nama: 'Database Updated Name',
      harga: 22000
    };

    await updateBarang(updateInput);

    // Verify in database
    const dbBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, created.id))
      .execute();

    expect(dbBarang).toHaveLength(1);
    expect(dbBarang[0].nama).toEqual('Database Updated Name');
    expect(parseFloat(dbBarang[0].harga)).toEqual(22000);
  });

  it('should throw error when barang not found', async () => {
    const updateInput: UpdateBarangInput = {
      id: 99999, // Non-existent ID
      nama: 'Should Not Update'
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when kode_barang already exists', async () => {
    // Create two barang items
    const barang1 = await createTestBarang(testBarang);
    await createTestBarang(anotherBarang);

    const updateInput: UpdateBarangInput = {
      id: barang1.id,
      kode_barang: 'ANOTHER001' // Try to use existing kode_barang
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow keeping the same kode_barang', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      kode_barang: 'TEST001', // Same kode_barang
      nama: 'Updated Name'
    };

    const result = await updateBarang(updateInput);

    expect(result.kode_barang).toEqual('TEST001');
    expect(result.nama).toEqual('Updated Name');
  });

  it('should handle zero values correctly', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      harga: 0,
      stok: 0
    };

    const result = await updateBarang(updateInput);

    expect(result.harga).toEqual(0);
    expect(result.stok).toEqual(0);
  });

  it('should validate numeric conversions correctly', async () => {
    // Create initial barang
    const created = await createTestBarang(testBarang);

    const updateInput: UpdateBarangInput = {
      id: created.id,
      harga: 999.99
    };

    const result = await updateBarang(updateInput);

    expect(result.harga).toEqual(999.99);
    expect(typeof result.harga).toBe('number');

    // Verify in database that it's stored correctly
    const dbBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, created.id))
      .execute();

    expect(parseFloat(dbBarang[0].harga)).toEqual(999.99);
  });
});
