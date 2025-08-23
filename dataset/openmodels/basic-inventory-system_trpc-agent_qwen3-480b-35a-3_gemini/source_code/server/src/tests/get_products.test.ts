import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test data
const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  sku: 'TP001',
  stockLevel: 10
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2',
  sku: 'TP002',
  stockLevel: 20
};

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(async () => {
    await resetDB();
  });

  it('should return an empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should return all products from the database', async () => {
    // Create test products
    const createdProduct1 = await db.insert(productsTable)
      .values({
        name: testProduct1.name,
        sku: testProduct1.sku,
        stockLevel: testProduct1.stockLevel
      })
      .returning()
      .execute();
      
    const createdProduct2 = await db.insert(productsTable)
      .values({
        name: testProduct2.name,
        sku: testProduct2.sku,
        stockLevel: testProduct2.stockLevel
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getProducts();

    // Validate results
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(2);
    
    // Check first product
    expect(result[0]).toEqual({
      id: createdProduct1[0].id,
      name: testProduct1.name,
      sku: testProduct1.sku,
      stockLevel: testProduct1.stockLevel,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
    
    // Check second product
    expect(result[1]).toEqual({
      id: createdProduct2[0].id,
      name: testProduct2.name,
      sku: testProduct2.sku,
      stockLevel: testProduct2.stockLevel,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
  });

  it('should handle numeric conversions correctly', async () => {
    // Create a test product
    await db.insert(productsTable)
      .values({
        name: testProduct1.name,
        sku: testProduct1.sku,
        stockLevel: testProduct1.stockLevel
      })
      .execute();

    const result = await getProducts();
    
    expect(result).toHaveLength(1);
    expect(typeof result[0].stockLevel).toBe('number');
    expect(result[0].stockLevel).toBe(testProduct1.stockLevel);
  });
});
