import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type UpdateBarangInput, type CreateBarangInput } from '../schema';
import { updateBarang } from '../handlers/update_barang';
import { eq } from 'drizzle-orm';

// Helper function to create a test barang
const createTestBarang = async (data: Partial<CreateBarangInput> = {}) => {
  const defaultData: CreateBarangInput = {
    nama_barang: 'Test Barang',
    kode_barang: 'TB001',
    deskripsi: 'Test description',
    harga_beli: 10000,
    harga_jual: 15000
  };

  const barangData = { ...defaultData, ...data };
  
  const result = await db.insert(barangTable)
    .values({
      nama_barang: barangData.nama_barang,
      kode_barang: barangData.kode_barang,
      deskripsi: barangData.deskripsi,
      harga_beli: barangData.harga_beli ? barangData.harga_beli.toString() : null,
      harga_jual: barangData.harga_jual ? barangData.harga_jual.toString() : null,
      jumlah_stok: 0
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update barang with all fields', async () => {
    // Create test barang first
    const testBarang = await createTestBarang();

    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      nama_barang: 'Updated Barang',
      kode_barang: 'UB001',
      deskripsi: 'Updated description',
      harga_beli: 12000,
      harga_jual: 18000
    };

    const result = await updateBarang(updateInput);

    // Verify all fields are updated
    expect(result.id).toBe(testBarang.id);
    expect(result.nama_barang).toBe('Updated Barang');
    expect(result.kode_barang).toBe('UB001');
    expect(result.deskripsi).toBe('Updated description');
    expect(result.harga_beli).toBe(12000);
    expect(result.harga_jual).toBe(18000);
    expect(result.jumlah_stok).toBe(0); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testBarang.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create test barang first
    const testBarang = await createTestBarang({
      nama_barang: 'Original Name',
      kode_barang: 'ORIG001',
      harga_beli: 5000,
      harga_jual: 8000
    });

    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      nama_barang: 'Updated Name Only'
    };

    const result = await updateBarang(updateInput);

    // Verify only nama_barang is updated, others remain unchanged
    expect(result.nama_barang).toBe('Updated Name Only');
    expect(result.kode_barang).toBe('ORIG001');
    expect(result.deskripsi).toBe('Test description');
    expect(result.harga_beli).toBe(5000);
    expect(result.harga_jual).toBe(8000);
    expect(result.updated_at > testBarang.updated_at).toBe(true);
  });

  it('should update harga fields to null', async () => {
    // Create test barang with prices
    const testBarang = await createTestBarang({
      harga_beli: 10000,
      harga_jual: 15000
    });

    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      harga_beli: null,
      harga_jual: null
    };

    const result = await updateBarang(updateInput);

    // Verify prices are set to null
    expect(result.harga_beli).toBeNull();
    expect(result.harga_jual).toBeNull();
    expect(result.nama_barang).toBe('Test Barang'); // Other fields unchanged
  });

  it('should save updated data to database', async () => {
    // Create test barang
    const testBarang = await createTestBarang();

    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      nama_barang: 'Database Test',
      kode_barang: 'DB001'
    };

    await updateBarang(updateInput);

    // Query database directly to verify data was saved
    const savedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, testBarang.id))
      .execute();

    expect(savedBarang).toHaveLength(1);
    expect(savedBarang[0].nama_barang).toBe('Database Test');
    expect(savedBarang[0].kode_barang).toBe('DB001');
    expect(savedBarang[0].updated_at > testBarang.updated_at).toBe(true);
  });

  it('should throw error when barang not found', async () => {
    const updateInput: UpdateBarangInput = {
      id: 99999,
      nama_barang: 'Non-existent Barang'
    };

    expect(updateBarang(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when kode_barang already exists', async () => {
    // Create two test barang
    const testBarang1 = await createTestBarang({
      kode_barang: 'TB001'
    });
    
    const testBarang2 = await createTestBarang({
      kode_barang: 'TB002'
    });

    // Try to update second barang with first barang's kode
    const updateInput: UpdateBarangInput = {
      id: testBarang2.id,
      kode_barang: 'TB001' // This should conflict
    };

    expect(updateBarang(updateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow updating barang with same kode_barang', async () => {
    // Create test barang
    const testBarang = await createTestBarang({
      kode_barang: 'SAME001'
    });

    // Update with same kode_barang should work
    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      nama_barang: 'Updated Name',
      kode_barang: 'SAME001' // Same as existing
    };

    const result = await updateBarang(updateInput);

    expect(result.nama_barang).toBe('Updated Name');
    expect(result.kode_barang).toBe('SAME001');
  });

  it('should handle numeric precision correctly', async () => {
    // Create test barang
    const testBarang = await createTestBarang();

    const updateInput: UpdateBarangInput = {
      id: testBarang.id,
      harga_beli: 12345.67,
      harga_jual: 98765.43
    };

    const result = await updateBarang(updateInput);

    // Verify numeric precision is maintained
    expect(result.harga_beli).toBe(12345.67);
    expect(result.harga_jual).toBe(98765.43);
    expect(typeof result.harga_beli).toBe('number');
    expect(typeof result.harga_jual).toBe('number');
  });
});
