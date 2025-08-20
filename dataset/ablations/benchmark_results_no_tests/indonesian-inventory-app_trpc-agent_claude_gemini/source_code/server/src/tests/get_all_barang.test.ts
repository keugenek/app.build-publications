import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { barangTable } from '../db/schema';
import { getAllBarang } from '../handlers/get_all_barang';

describe('getAllBarang', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no barang exist', async () => {
    const result = await getAllBarang();
    expect(result).toEqual([]);
  });

  it('should return all barang when they exist', async () => {
    // Create test barang
    await db.insert(barangTable)
      .values([
        {
          nama: 'Laptop',
          kode: 'LP001',
          jumlah_stok: 10,
          deskripsi: 'Gaming laptop'
        },
        {
          nama: 'Mouse',
          kode: 'MS001',
          jumlah_stok: 25,
          deskripsi: null
        },
        {
          nama: 'Keyboard',
          kode: 'KB001',
          jumlah_stok: 0,
          deskripsi: 'Mechanical keyboard'
        }
      ])
      .execute();

    const result = await getAllBarang();

    expect(result).toHaveLength(3);
    
    // Check first item
    const laptop = result.find(item => item.kode === 'LP001');
    expect(laptop).toBeDefined();
    expect(laptop!.nama).toEqual('Laptop');
    expect(laptop!.jumlah_stok).toEqual(10);
    expect(laptop!.deskripsi).toEqual('Gaming laptop');
    expect(laptop!.id).toBeDefined();
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Check second item with null description
    const mouse = result.find(item => item.kode === 'MS001');
    expect(mouse).toBeDefined();
    expect(mouse!.nama).toEqual('Mouse');
    expect(mouse!.jumlah_stok).toEqual(25);
    expect(mouse!.deskripsi).toBeNull();

    // Check third item with zero stock
    const keyboard = result.find(item => item.kode === 'KB001');
    expect(keyboard).toBeDefined();
    expect(keyboard!.nama).toEqual('Keyboard');
    expect(keyboard!.jumlah_stok).toEqual(0);
    expect(keyboard!.deskripsi).toEqual('Mechanical keyboard');
  });

  it('should return barang ordered by creation time', async () => {
    // Create barang with slight delays to ensure different timestamps
    await db.insert(barangTable)
      .values({
        nama: 'First Item',
        kode: 'FIRST',
        jumlah_stok: 5,
        deskripsi: 'First created item'
      })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(barangTable)
      .values({
        nama: 'Second Item',
        kode: 'SECOND',
        jumlah_stok: 10,
        deskripsi: 'Second created item'
      })
      .execute();

    const result = await getAllBarang();

    expect(result).toHaveLength(2);
    
    // Items should be returned in database order (typically by ID/creation time)
    const firstItem = result[0];
    const secondItem = result[1];
    
    expect(firstItem.kode).toEqual('FIRST');
    expect(secondItem.kode).toEqual('SECOND');
    
    // Verify timestamps are properly handled
    expect(firstItem.created_at).toBeInstanceOf(Date);
    expect(secondItem.created_at).toBeInstanceOf(Date);
    expect(firstItem.created_at <= secondItem.created_at).toBe(true);
  });

  it('should handle large number of items efficiently', async () => {
    // Create multiple items to test performance and handling
    const items = Array.from({ length: 50 }, (_, i) => ({
      nama: `Item ${i + 1}`,
      kode: `ITM${(i + 1).toString().padStart(3, '0')}`,
      jumlah_stok: i + 1,
      deskripsi: i % 2 === 0 ? `Description for item ${i + 1}` : null
    }));

    await db.insert(barangTable)
      .values(items)
      .execute();

    const result = await getAllBarang();

    expect(result).toHaveLength(50);
    
    // Verify all items are returned with correct data
    result.forEach((item, index) => {
      expect(item.nama).toEqual(`Item ${index + 1}`);
      expect(item.kode).toEqual(`ITM${(index + 1).toString().padStart(3, '0')}`);
      expect(item.jumlah_stok).toEqual(index + 1);
      expect(item.id).toBeDefined();
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });
});
