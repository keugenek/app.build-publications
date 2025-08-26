import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { getAllBarang } from '../handlers/get_all_barang';

// Test data for creating barang
const testBarang1: CreateBarangInput = {
  nama_barang: 'Laptop Dell',
  kode_sku: 'LAPTOP-001',
  jumlah_stok: 10
};

const testBarang2: CreateBarangInput = {
  nama_barang: 'Mouse Wireless',
  kode_sku: 'MOUSE-002',
  jumlah_stok: 25
};

const testBarang3: CreateBarangInput = {
  nama_barang: 'Keyboard Mechanical',
  kode_sku: 'KB-003',
  jumlah_stok: 0
};

describe('getAllBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no barang exists', async () => {
    const result = await getAllBarang();

    expect(result).toEqual([]);
    expect(result.length).toEqual(0);
  });

  it('should fetch all barang from database', async () => {
    // Create test barang records
    await db.insert(barangTable).values([
      {
        nama_barang: testBarang1.nama_barang,
        kode_sku: testBarang1.kode_sku,
        jumlah_stok: testBarang1.jumlah_stok
      },
      {
        nama_barang: testBarang2.nama_barang,
        kode_sku: testBarang2.kode_sku,
        jumlah_stok: testBarang2.jumlah_stok
      }
    ]).execute();

    const result = await getAllBarang();

    // Verify we get all records
    expect(result).toHaveLength(2);
    
    // Verify field types and values
    const laptop = result.find(b => b.kode_sku === 'LAPTOP-001');
    const mouse = result.find(b => b.kode_sku === 'MOUSE-002');

    expect(laptop).toBeDefined();
    expect(laptop!.nama_barang).toEqual('Laptop Dell');
    expect(laptop!.jumlah_stok).toEqual(10);
    expect(laptop!.id).toBeDefined();
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    expect(mouse).toBeDefined();
    expect(mouse!.nama_barang).toEqual('Mouse Wireless');
    expect(mouse!.jumlah_stok).toEqual(25);
    expect(mouse!.id).toBeDefined();
    expect(mouse!.created_at).toBeInstanceOf(Date);
    expect(mouse!.updated_at).toBeInstanceOf(Date);
  });

  it('should return barang with zero stock', async () => {
    // Create barang with zero stock
    await db.insert(barangTable).values({
      nama_barang: testBarang3.nama_barang,
      kode_sku: testBarang3.kode_sku,
      jumlah_stok: testBarang3.jumlah_stok
    }).execute();

    const result = await getAllBarang();

    expect(result).toHaveLength(1);
    expect(result[0].nama_barang).toEqual('Keyboard Mechanical');
    expect(result[0].jumlah_stok).toEqual(0);
    expect(result[0].kode_sku).toEqual('KB-003');
  });

  it('should maintain correct data types for all fields', async () => {
    // Create a test barang
    await db.insert(barangTable).values({
      nama_barang: testBarang1.nama_barang,
      kode_sku: testBarang1.kode_sku,
      jumlah_stok: testBarang1.jumlah_stok
    }).execute();

    const result = await getAllBarang();

    expect(result).toHaveLength(1);
    const barang = result[0];

    // Verify all field types
    expect(typeof barang.id).toBe('number');
    expect(typeof barang.nama_barang).toBe('string');
    expect(typeof barang.kode_sku).toBe('string');
    expect(typeof barang.jumlah_stok).toBe('number');
    expect(barang.created_at).toBeInstanceOf(Date);
    expect(barang.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple barang in insertion order', async () => {
    // Insert multiple barang in specific order
    const insertData = [testBarang1, testBarang2, testBarang3];
    
    for (const barang of insertData) {
      await db.insert(barangTable).values({
        nama_barang: barang.nama_barang,
        kode_sku: barang.kode_sku,
        jumlah_stok: barang.jumlah_stok
      }).execute();
    }

    const result = await getAllBarang();

    expect(result).toHaveLength(3);
    
    // Verify all expected SKUs are present
    const skus = result.map(b => b.kode_sku);
    expect(skus).toContain('LAPTOP-001');
    expect(skus).toContain('MOUSE-002');
    expect(skus).toContain('KB-003');
    
    // Verify IDs are sequential (insertion order)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
