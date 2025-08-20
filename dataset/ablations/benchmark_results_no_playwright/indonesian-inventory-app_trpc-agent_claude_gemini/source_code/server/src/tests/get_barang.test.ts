import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { type CreateBarangInput } from '../schema';
import { getBarang, getBarangById } from '../handlers/get_barang';

// Test data for barang
const testBarang1: CreateBarangInput = {
  nama_barang: 'Laptop Dell',
  kode_barang: 'DELL001',
  deskripsi: 'Laptop Dell Inspiron 15',
  harga_beli: 5000000.50,
  harga_jual: 7500000.75
};

const testBarang2: CreateBarangInput = {
  nama_barang: 'Mouse Logitech',
  kode_barang: 'LOG002',
  deskripsi: 'Mouse wireless Logitech',
  harga_beli: 150000,
  harga_jual: 225000
};

const testBarang3: CreateBarangInput = {
  nama_barang: 'Keyboard',
  kode_barang: 'KEY003',
  deskripsi: null,
  harga_beli: null,
  harga_jual: null
};

describe('getBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no barang exists', async () => {
    const result = await getBarang();
    expect(result).toEqual([]);
  });

  it('should return all barang items', async () => {
    // Insert test data
    await db.insert(barangTable).values([
      {
        ...testBarang1,
        harga_beli: testBarang1.harga_beli?.toString(),
        harga_jual: testBarang1.harga_jual?.toString()
      },
      {
        ...testBarang2,
        harga_beli: testBarang2.harga_beli?.toString(),
        harga_jual: testBarang2.harga_jual?.toString()
      }
    ]).execute();

    const result = await getBarang();

    expect(result).toHaveLength(2);
    
    // Verify first item
    const laptop = result.find(b => b.kode_barang === 'DELL001');
    expect(laptop).toBeDefined();
    expect(laptop!.nama_barang).toEqual('Laptop Dell');
    expect(laptop!.deskripsi).toEqual('Laptop Dell Inspiron 15');
    expect(laptop!.harga_beli).toEqual(5000000.50);
    expect(laptop!.harga_jual).toEqual(7500000.75);
    expect(typeof laptop!.harga_beli).toEqual('number');
    expect(typeof laptop!.harga_jual).toEqual('number');
    expect(laptop!.jumlah_stok).toEqual(0); // Default value
    expect(laptop!.id).toBeDefined();
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Verify second item
    const mouse = result.find(b => b.kode_barang === 'LOG002');
    expect(mouse).toBeDefined();
    expect(mouse!.nama_barang).toEqual('Mouse Logitech');
    expect(mouse!.harga_beli).toEqual(150000);
    expect(mouse!.harga_jual).toEqual(225000);
  });

  it('should handle null numeric values correctly', async () => {
    // Insert item with null prices
    await db.insert(barangTable).values({
      ...testBarang3,
      harga_beli: testBarang3.harga_beli?.toString() || null,
      harga_jual: testBarang3.harga_jual?.toString() || null
    }).execute();

    const result = await getBarang();

    expect(result).toHaveLength(1);
    const keyboard = result[0];
    expect(keyboard.nama_barang).toEqual('Keyboard');
    expect(keyboard.kode_barang).toEqual('KEY003');
    expect(keyboard.deskripsi).toBeNull();
    expect(keyboard.harga_beli).toBeNull();
    expect(keyboard.harga_jual).toBeNull();
  });

  it('should return items ordered by creation time', async () => {
    // Insert items with slight delay to ensure different timestamps
    await db.insert(barangTable).values({
      ...testBarang1,
      harga_beli: testBarang1.harga_beli?.toString(),
      harga_jual: testBarang1.harga_jual?.toString()
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(barangTable).values({
      ...testBarang2,
      harga_beli: testBarang2.harga_beli?.toString(),
      harga_jual: testBarang2.harga_jual?.toString()
    }).execute();

    const result = await getBarang();

    expect(result).toHaveLength(2);
    // First inserted should have earlier created_at
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});

describe('getBarangById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when barang does not exist', async () => {
    const result = await getBarangById(999);
    expect(result).toBeNull();
  });

  it('should return barang when it exists', async () => {
    // Insert test barang
    const insertResult = await db.insert(barangTable).values({
      ...testBarang1,
      harga_beli: testBarang1.harga_beli?.toString(),
      harga_jual: testBarang1.harga_jual?.toString()
    }).returning().execute();

    const insertedId = insertResult[0].id;

    const result = await getBarangById(insertedId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.nama_barang).toEqual('Laptop Dell');
    expect(result!.kode_barang).toEqual('DELL001');
    expect(result!.deskripsi).toEqual('Laptop Dell Inspiron 15');
    expect(result!.harga_beli).toEqual(5000000.50);
    expect(result!.harga_jual).toEqual(7500000.75);
    expect(typeof result!.harga_beli).toEqual('number');
    expect(typeof result!.harga_jual).toEqual('number');
    expect(result!.jumlah_stok).toEqual(0);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle barang with null prices', async () => {
    // Insert barang with null prices
    const insertResult = await db.insert(barangTable).values({
      ...testBarang3,
      harga_beli: testBarang3.harga_beli?.toString() || null,
      harga_jual: testBarang3.harga_jual?.toString() || null
    }).returning().execute();

    const insertedId = insertResult[0].id;

    const result = await getBarangById(insertedId);

    expect(result).not.toBeNull();
    expect(result!.nama_barang).toEqual('Keyboard');
    expect(result!.kode_barang).toEqual('KEY003');
    expect(result!.deskripsi).toBeNull();
    expect(result!.harga_beli).toBeNull();
    expect(result!.harga_jual).toBeNull();
  });

  it('should return correct barang when multiple exist', async () => {
    // Insert multiple barang
    const insertResults = await db.insert(barangTable).values([
      {
        ...testBarang1,
        harga_beli: testBarang1.harga_beli?.toString(),
        harga_jual: testBarang1.harga_jual?.toString()
      },
      {
        ...testBarang2,
        harga_beli: testBarang2.harga_beli?.toString(),
        harga_jual: testBarang2.harga_jual?.toString()
      }
    ]).returning().execute();

    const secondId = insertResults[1].id;

    const result = await getBarangById(secondId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondId);
    expect(result!.nama_barang).toEqual('Mouse Logitech');
    expect(result!.kode_barang).toEqual('LOG002');
    expect(result!.harga_beli).toEqual(150000);
    expect(result!.harga_jual).toEqual(225000);
  });
});
