import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';
import { eq } from 'drizzle-orm';

// Test input for creating products
const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  sku: 'TEST-001',
  stock_level: 50
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2',
  sku: 'TEST-002',
  stock_level: 100
};

const testProduct3: CreateProductInput = {
  name: 'Test Product 3',
  sku: 'TEST-003',
  stock_level: 0
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all products with correct fields', async () => {
    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: testProduct1.name,
          sku: testProduct1.sku,
          stock_level: testProduct1.stock_level
        },
        {
          name: testProduct2.name,
          sku: testProduct2.sku,
          stock_level: testProduct2.stock_level
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Check first product
    const product1 = result.find(p => p.sku === 'TEST-001');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.sku).toEqual('TEST-001');
    expect(product1!.stock_level).toEqual(50);
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);

    // Check second product
    const product2 = result.find(p => p.sku === 'TEST-002');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.sku).toEqual('TEST-002');
    expect(product2!.stock_level).toEqual(100);
    expect(product2!.id).toBeDefined();
    expect(product2!.created_at).toBeInstanceOf(Date);
    expect(product2!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle products with zero stock level', async () => {
    // Create product with zero stock
    await db.insert(productsTable)
      .values({
        name: testProduct3.name,
        sku: testProduct3.sku,
        stock_level: testProduct3.stock_level
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].stock_level).toEqual(0);
    expect(result[0].name).toEqual('Test Product 3');
    expect(result[0].sku).toEqual('TEST-003');
  });

  it('should return products in database insertion order', async () => {
    // Create multiple products in specific order
    const products = [testProduct1, testProduct2, testProduct3];
    
    for (const product of products) {
      await db.insert(productsTable)
        .values({
          name: product.name,
          sku: product.sku,
          stock_level: product.stock_level
        })
        .execute();
    }

    const result = await getProducts();

    expect(result).toHaveLength(3);
    
    // Verify all products are returned with correct data
    expect(result.map(p => p.sku)).toEqual(['TEST-001', 'TEST-002', 'TEST-003']);
    expect(result.map(p => p.name)).toEqual([
      'Test Product 1', 
      'Test Product 2', 
      'Test Product 3'
    ]);
    expect(result.map(p => p.stock_level)).toEqual([50, 100, 0]);
  });

  it('should return all required Product schema fields', async () => {
    // Create a single product to test field completeness
    await db.insert(productsTable)
      .values({
        name: testProduct1.name,
        sku: testProduct1.sku,
        stock_level: testProduct1.stock_level
      })
      .execute();

    const result = await getProducts();
    const product = result[0];

    // Verify all required fields from Product schema are present
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('sku');
    expect(product).toHaveProperty('stock_level');
    expect(product).toHaveProperty('created_at');
    expect(product).toHaveProperty('updated_at');

    // Verify field types
    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.sku).toBe('string');
    expect(typeof product.stock_level).toBe('number');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });

  it('should maintain data integrity with database', async () => {
    // Create a product via handler
    await db.insert(productsTable)
      .values({
        name: testProduct1.name,
        sku: testProduct1.sku,
        stock_level: testProduct1.stock_level
      })
      .execute();

    const handlerResult = await getProducts();
    
    // Query database directly to compare
    const dbResult = await db.select()
      .from(productsTable)
      .execute();

    expect(handlerResult).toHaveLength(dbResult.length);
    expect(handlerResult[0].id).toEqual(dbResult[0].id);
    expect(handlerResult[0].name).toEqual(dbResult[0].name);
    expect(handlerResult[0].sku).toEqual(dbResult[0].sku);
    expect(handlerResult[0].stock_level).toEqual(dbResult[0].stock_level);
    expect(handlerResult[0].created_at).toEqual(dbResult[0].created_at);
    expect(handlerResult[0].updated_at).toEqual(dbResult[0].updated_at);
  });
});
