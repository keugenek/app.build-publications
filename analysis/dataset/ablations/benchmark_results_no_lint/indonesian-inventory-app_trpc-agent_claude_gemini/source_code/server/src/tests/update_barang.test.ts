import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type UpdateBarangInput } from '../schema';
import { updateBarang } from '../handlers/update_barang';
import { eq } from 'drizzle-orm';

describe('updateBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update nama_barang only', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Original Product',
        kode_sku: 'ORIG-001',
        jumlah_stok: 50
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;
    const originalUpdatedAt = initialBarang[0].updated_at;

    // Wait a moment to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBarangInput = {
      id: barangId,
      nama_barang: 'Updated Product Name'
    };

    const result = await updateBarang(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(barangId);
    expect(result.nama_barang).toEqual('Updated Product Name');
    expect(result.kode_sku).toEqual('ORIG-001'); // Unchanged
    expect(result.jumlah_stok).toEqual(50); // Unchanged
    expect(result.created_at).toEqual(initialBarang[0].created_at); // Unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update kode_sku only', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Test Product',
        kode_sku: 'TEST-001',
        jumlah_stok: 25
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    const updateInput: UpdateBarangInput = {
      id: barangId,
      kode_sku: 'TEST-002'
    };

    const result = await updateBarang(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(barangId);
    expect(result.nama_barang).toEqual('Test Product'); // Unchanged
    expect(result.kode_sku).toEqual('TEST-002'); // Updated
    expect(result.jumlah_stok).toEqual(25); // Unchanged
  });

  it('should update jumlah_stok only', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Stock Product',
        kode_sku: 'STOCK-001',
        jumlah_stok: 100
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    const updateInput: UpdateBarangInput = {
      id: barangId,
      jumlah_stok: 75
    };

    const result = await updateBarang(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(barangId);
    expect(result.nama_barang).toEqual('Stock Product'); // Unchanged
    expect(result.kode_sku).toEqual('STOCK-001'); // Unchanged
    expect(result.jumlah_stok).toEqual(75); // Updated
  });

  it('should update all fields at once', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Original Product',
        kode_sku: 'ORIG-001',
        jumlah_stok: 10
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    const updateInput: UpdateBarangInput = {
      id: barangId,
      nama_barang: 'Completely Updated Product',
      kode_sku: 'UPDATED-001',
      jumlah_stok: 200
    };

    const result = await updateBarang(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(barangId);
    expect(result.nama_barang).toEqual('Completely Updated Product');
    expect(result.kode_sku).toEqual('UPDATED-001');
    expect(result.jumlah_stok).toEqual(200);
    expect(result.created_at).toEqual(initialBarang[0].created_at); // Should remain unchanged
  });

  it('should save updated barang to database', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Database Test Product',
        kode_sku: 'DB-TEST-001',
        jumlah_stok: 30
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    const updateInput: UpdateBarangInput = {
      id: barangId,
      nama_barang: 'Updated Database Test',
      jumlah_stok: 45
    };

    await updateBarang(updateInput);

    // Query database to verify changes were persisted
    const savedBarang = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, barangId))
      .execute();

    expect(savedBarang).toHaveLength(1);
    expect(savedBarang[0].nama_barang).toEqual('Updated Database Test');
    expect(savedBarang[0].kode_sku).toEqual('DB-TEST-001'); // Unchanged
    expect(savedBarang[0].jumlah_stok).toEqual(45);
  });

  it('should throw error when barang does not exist', async () => {
    const updateInput: UpdateBarangInput = {
      id: 99999, // Non-existent ID
      nama_barang: 'This should fail'
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when kode_sku already exists for different barang', async () => {
    // Create two barang records
    const barang1 = await db.insert(barangTable)
      .values({
        nama_barang: 'Product 1',
        kode_sku: 'PROD-001',
        jumlah_stok: 10
      })
      .returning()
      .execute();

    await db.insert(barangTable)
      .values({
        nama_barang: 'Product 2',
        kode_sku: 'PROD-002',
        jumlah_stok: 20
      })
      .returning()
      .execute();

    // Try to update barang1 to use barang2's SKU
    const updateInput: UpdateBarangInput = {
      id: barang1[0].id,
      kode_sku: 'PROD-002' // This SKU already exists
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow updating barang with its own kode_sku', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Same SKU Product',
        kode_sku: 'SAME-001',
        jumlah_stok: 15
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    // Update with the same SKU (should be allowed)
    const updateInput: UpdateBarangInput = {
      id: barangId,
      nama_barang: 'Updated Same SKU Product',
      kode_sku: 'SAME-001' // Same as existing
    };

    const result = await updateBarang(updateInput);

    expect(result.id).toEqual(barangId);
    expect(result.nama_barang).toEqual('Updated Same SKU Product');
    expect(result.kode_sku).toEqual('SAME-001');
  });

  it('should handle zero stock quantity update', async () => {
    // Create initial barang
    const initialBarang = await db.insert(barangTable)
      .values({
        nama_barang: 'Zero Stock Product',
        kode_sku: 'ZERO-001',
        jumlah_stok: 50
      })
      .returning()
      .execute();

    const barangId = initialBarang[0].id;

    const updateInput: UpdateBarangInput = {
      id: barangId,
      jumlah_stok: 0
    };

    const result = await updateBarang(updateInput);

    expect(result.id).toEqual(barangId);
    expect(result.jumlah_stok).toEqual(0);
  });
});
