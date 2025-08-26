import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type UpdateBarangInput, type CreateBarangInput } from '../schema';
import { updateBarang } from '../handlers/update_barang';
import { eq } from 'drizzle-orm';

// Helper function to create test barang
const createTestBarang = async (input: CreateBarangInput) => {
  const result = await db.insert(barangTable)
    .values({
      nama: input.nama,
      kode: input.kode,
      jumlah_stok: input.jumlah_stok,
      deskripsi: input.deskripsi
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update barang with all fields', async () => {
    // Create initial barang
    const initialBarang = await createTestBarang({
      nama: 'Barang Awal',
      kode: 'AWAL001',
      jumlah_stok: 50,
      deskripsi: 'Deskripsi awal'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      nama: 'Barang Updated',
      kode: 'UPDATE001',
      jumlah_stok: 75,
      deskripsi: 'Deskripsi yang sudah diupdate'
    };

    const result = await updateBarang(updateInput);

    expect(result.id).toEqual(initialBarang.id);
    expect(result.nama).toEqual('Barang Updated');
    expect(result.kode).toEqual('UPDATE001');
    expect(result.jumlah_stok).toEqual(75);
    expect(result.deskripsi).toEqual('Deskripsi yang sudah diupdate');
    expect(result.created_at).toEqual(initialBarang.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialBarang.updated_at.getTime());
  });

  it('should update only specified fields', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Barang Awal',
      kode: 'AWAL002',
      jumlah_stok: 30,
      deskripsi: 'Deskripsi awal'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      nama: 'Nama Baru'
      // Only updating nama, other fields should remain unchanged
    };

    const result = await updateBarang(updateInput);

    expect(result.nama).toEqual('Nama Baru');
    expect(result.kode).toEqual('AWAL002'); // Should remain unchanged
    expect(result.jumlah_stok).toEqual(30); // Should remain unchanged
    expect(result.deskripsi).toEqual('Deskripsi awal'); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(initialBarang.updated_at.getTime());
  });

  it('should update barang to have null description', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Barang Test',
      kode: 'TEST001',
      jumlah_stok: 20,
      deskripsi: 'Ada deskripsi'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      deskripsi: null
    };

    const result = await updateBarang(updateInput);

    expect(result.deskripsi).toBeNull();
    expect(result.nama).toEqual('Barang Test'); // Should remain unchanged
  });

  it('should save updated barang to database', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Barang Database',
      kode: 'DB001',
      jumlah_stok: 15,
      deskripsi: 'Test database'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      nama: 'Barang Database Updated',
      jumlah_stok: 25
    };

    await updateBarang(updateInput);

    // Verify changes in database
    const updatedInDb = await db.select()
      .from(barangTable)
      .where(eq(barangTable.id, initialBarang.id))
      .execute();

    expect(updatedInDb).toHaveLength(1);
    expect(updatedInDb[0].nama).toEqual('Barang Database Updated');
    expect(updatedInDb[0].jumlah_stok).toEqual(25);
    expect(updatedInDb[0].kode).toEqual('DB001'); // Should remain unchanged
    expect(updatedInDb[0].updated_at).toBeInstanceOf(Date);
    expect(updatedInDb[0].updated_at.getTime()).toBeGreaterThan(initialBarang.updated_at.getTime());
  });

  it('should throw error when barang does not exist', async () => {
    const updateInput: UpdateBarangInput = {
      id: 999999, // Non-existent ID
      nama: 'Tidak Ada'
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/tidak ditemukan/i);
  });

  it('should throw error when kode already exists on another barang', async () => {
    // Create first barang
    await createTestBarang({
      nama: 'Barang Pertama',
      kode: 'EXIST001',
      jumlah_stok: 10,
      deskripsi: 'Barang pertama'
    });

    // Create second barang
    const secondBarang = await createTestBarang({
      nama: 'Barang Kedua',
      kode: 'EXIST002',
      jumlah_stok: 20,
      deskripsi: 'Barang kedua'
    });

    // Try to update second barang with kode that already exists
    const updateInput: UpdateBarangInput = {
      id: secondBarang.id,
      kode: 'EXIST001' // This kode already exists
    };

    await expect(updateBarang(updateInput)).rejects.toThrow(/sudah digunakan/i);
  });

  it('should allow updating barang with same kode (no change)', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Barang Same Kode',
      kode: 'SAME001',
      jumlah_stok: 10,
      deskripsi: 'Test same kode'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      kode: 'SAME001', // Same kode as before
      nama: 'Nama Baru'
    };

    const result = await updateBarang(updateInput);

    expect(result.kode).toEqual('SAME001');
    expect(result.nama).toEqual('Nama Baru');
  });

  it('should update jumlah_stok to zero', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Barang Zero Stock',
      kode: 'ZERO001',
      jumlah_stok: 50,
      deskripsi: 'Test zero stock'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      jumlah_stok: 0
    };

    const result = await updateBarang(updateInput);

    expect(result.jumlah_stok).toEqual(0);
    expect(result.nama).toEqual('Barang Zero Stock'); // Should remain unchanged
  });

  it('should handle multiple field updates correctly', async () => {
    const initialBarang = await createTestBarang({
      nama: 'Multi Update Test',
      kode: 'MULTI001',
      jumlah_stok: 100,
      deskripsi: 'Original desc'
    });

    const updateInput: UpdateBarangInput = {
      id: initialBarang.id,
      nama: 'Updated Multi Test',
      jumlah_stok: 150,
      deskripsi: null // Remove description
    };

    const result = await updateBarang(updateInput);

    expect(result.nama).toEqual('Updated Multi Test');
    expect(result.kode).toEqual('MULTI001'); // Should remain unchanged
    expect(result.jumlah_stok).toEqual(150);
    expect(result.deskripsi).toBeNull();
    expect(result.updated_at.getTime()).toBeGreaterThan(initialBarang.updated_at.getTime());
  });
});
