import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { getProducts } from '../handlers/get_products';
import { eq } from 'drizzle-orm';

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    // Insert test data directly using Drizzle
    await db.insert(productsTable).values([
      {
        name: 'Test Product 1',
        sku: 'TP001',
        stock_quantity: 10
      },
      {
        name: 'Test Product 2',
        sku: 'TP002',
        stock_quantity: 20
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all products from the database', async () => {
    const products = await getProducts();

    expect(products).toHaveLength(2);
    
    // Check that we got the expected products
    const productNames = products.map(p => p.name).sort();
    expect(productNames).toEqual(['Test Product 1', 'Test Product 2']);
  });

  it('should return an empty array when no products exist', async () => {
    // Clear the database first
    await resetDB();
    await createDB();
    
    const products = await getProducts();
    expect(products).toHaveLength(0);
  });

  it('should preserve correct data types', async () => {
    const products = await getProducts();
    const product = products[0];

    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.sku).toBe('string');
    expect(typeof product.stock_quantity).toBe('number');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });
});
