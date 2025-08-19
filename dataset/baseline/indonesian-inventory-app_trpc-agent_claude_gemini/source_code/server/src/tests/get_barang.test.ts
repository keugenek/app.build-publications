import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { getBarang } from '../handlers/get_barang';

describe('getBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no barang exist', async () => {
    const result = await getBarang();

    expect(result).toEqual([]);
  });

  it('should return all barang ordered by created_at descending', async () => {
    // Create test barang with slight delays to ensure different timestamps
    const barang1Data = {
      nama: 'Barang Pertama',
      kode_barang: 'BRG001',
      deskripsi: 'Deskripsi barang pertama',
      harga: '100.50',
      stok: 10
    };

    const barang2Data = {
      nama: 'Barang Kedua',
      kode_barang: 'BRG002',
      deskripsi: 'Deskripsi barang kedua',
      harga: '200.75',
      stok: 5
    };

    const barang3Data = {
      nama: 'Barang Ketiga',
      kode_barang: 'BRG003',
      deskripsi: null,
      harga: '50.25',
      stok: 15
    };

    // Insert barang one by one to ensure different timestamps
    const [barang1] = await db.insert(barangTable)
      .values(barang1Data)
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [barang2] = await db.insert(barangTable)
      .values(barang2Data)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const [barang3] = await db.insert(barangTable)
      .values(barang3Data)
      .returning()
      .execute();

    const result = await getBarang();

    // Should have 3 items
    expect(result).toHaveLength(3);

    // Should be ordered by created_at descending (newest first)
    expect(result[0].id).toBe(barang3.id);
    expect(result[1].id).toBe(barang2.id);
    expect(result[2].id).toBe(barang1.id);

    // Verify first item (newest)
    expect(result[0].nama).toBe('Barang Ketiga');
    expect(result[0].kode_barang).toBe('BRG003');
    expect(result[0].deskripsi).toBeNull();
    expect(result[0].harga).toBe(50.25);
    expect(typeof result[0].harga).toBe('number');
    expect(result[0].stok).toBe(15);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second item
    expect(result[1].nama).toBe('Barang Kedua');
    expect(result[1].kode_barang).toBe('BRG002');
    expect(result[1].deskripsi).toBe('Deskripsi barang kedua');
    expect(result[1].harga).toBe(200.75);
    expect(typeof result[1].harga).toBe('number');
    expect(result[1].stok).toBe(5);

    // Verify third item (oldest)
    expect(result[2].nama).toBe('Barang Pertama');
    expect(result[2].kode_barang).toBe('BRG001');
    expect(result[2].deskripsi).toBe('Deskripsi barang pertama');
    expect(result[2].harga).toBe(100.50);
    expect(typeof result[2].harga).toBe('number');
    expect(result[2].stok).toBe(10);
  });

  it('should handle barang with null deskripsi correctly', async () => {
    const barangData = {
      nama: 'Test Barang',
      kode_barang: 'TEST001',
      deskripsi: null,
      harga: '99.99',
      stok: 5
    };

    await db.insert(barangTable)
      .values(barangData)
      .execute();

    const result = await getBarang();

    expect(result).toHaveLength(1);
    expect(result[0].deskripsi).toBeNull();
    expect(result[0].nama).toBe('Test Barang');
    expect(result[0].harga).toBe(99.99);
  });

  it('should correctly convert numeric harga field', async () => {
    const barangData = {
      nama: 'Price Test',
      kode_barang: 'PRICE001',
      deskripsi: 'Test for price conversion',
      harga: '123.45',
      stok: 10
    };

    await db.insert(barangTable)
      .values(barangData)
      .execute();

    const result = await getBarang();

    expect(result).toHaveLength(1);
    expect(result[0].harga).toBe(123.45);
    expect(typeof result[0].harga).toBe('number');
  });

  it('should handle zero stock correctly', async () => {
    const barangData = {
      nama: 'Zero Stock Item',
      kode_barang: 'ZERO001',
      deskripsi: 'Item with zero stock',
      harga: '10.00',
      stok: 0
    };

    await db.insert(barangTable)
      .values(barangData)
      .execute();

    const result = await getBarang();

    expect(result).toHaveLength(1);
    expect(result[0].stok).toBe(0);
    expect(result[0].nama).toBe('Zero Stock Item');
  });
});
