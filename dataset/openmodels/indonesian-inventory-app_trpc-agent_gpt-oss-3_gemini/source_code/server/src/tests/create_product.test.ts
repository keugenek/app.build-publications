import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  nama: 'Test Product',
  deskripsi: 'A product for testing',
  jumlah_stok: 10,
  harga_satuan: 19.99,
  kode_sku: 'SKU12345'
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with correct fields', async () => {
    const result = await createProduct(testInput);
    expect(result.id).toBeDefined();
    expect(result.nama).toBe('Test Product');
    expect(result.deskripsi).toBe('A product for testing');
    expect(result.jumlah_stok).toBe(10);
    expect(result.harga_satuan).toBe(19.99);
    expect(result.kode_sku).toBe('SKU12345');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist product in the database', async () => {
    const result = await createProduct(testInput);
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.nama).toBe('Test Product');
    expect(row.deskripsi).toBe('A product for testing');
    expect(row.jumlah_stok).toBe(10);
    // numeric column stored as string, convert to number
    expect(parseFloat(row.harga_satuan as any)).toBe(19.99);
    expect(row.kode_sku).toBe('SKU12345');
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
