import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { getProducts } from '../handlers/get_products';
import { sql } from 'drizzle-orm';

// Helper to insert a product directly
const insertTestProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
  const { harga_satuan, ...rest } = product;
  const result = await db
    .insert(productsTable)
    .values({
      ...rest,
      // numeric column stored as string
      harga_satuan: harga_satuan.toString(),
    })
    .returning()
    .execute();
  return result[0];
};

describe('getProducts handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no products exist', async () => {
    const products = await getProducts();
    expect(products).toEqual([]);
  });

  it('should fetch all products with correct numeric conversion', async () => {
    // Insert two products
    await insertTestProduct({
      nama: 'Product A',
      deskripsi: 'First product',
      jumlah_stok: 10,
      harga_satuan: 5.5,
      kode_sku: 'SKU001',
    });
    await insertTestProduct({
      nama: 'Product B',
      deskripsi: null,
      jumlah_stok: 20,
      harga_satuan: 12.34,
      kode_sku: 'SKU002',
    });

    const products = await getProducts();
    expect(products).toHaveLength(2);

    // Verify fields and numeric conversion
    const productA = products.find((p) => p.kode_sku === 'SKU001') as Product;
    expect(productA.nama).toBe('Product A');
    expect(productA.harga_satuan).toBe(5.5);
    expect(typeof productA.harga_satuan).toBe('number');

    const productB = products.find((p) => p.kode_sku === 'SKU002') as Product;
    expect(productB.deskripsi).toBeNull();
    expect(productB.harga_satuan).toBe(12.34);
  });
});
