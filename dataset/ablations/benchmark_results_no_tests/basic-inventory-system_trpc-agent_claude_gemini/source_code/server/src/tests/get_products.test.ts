import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test data for creating products
const testProducts: CreateProductInput[] = [
  {
    name: 'Zebra Product',
    sku: 'ZEB-001',
    stock_level: 50
  },
  {
    name: 'Alpha Product',
    sku: 'ALP-001', 
    stock_level: 100
  },
  {
    name: 'Beta Product',
    sku: 'BET-001',
    stock_level: 0
  }
];

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all products ordered by name', async () => {
    // Create test products in database
    for (const product of testProducts) {
      await db.insert(productsTable)
        .values({
          name: product.name,
          sku: product.sku,
          stock_level: product.stock_level
        })
        .execute();
    }

    const result = await getProducts();

    // Should return 3 products
    expect(result).toHaveLength(3);
    
    // Should be ordered alphabetically by name (Alpha, Beta, Zebra)
    expect(result[0].name).toBe('Alpha Product');
    expect(result[1].name).toBe('Beta Product');
    expect(result[2].name).toBe('Zebra Product');

    // Verify all fields are present and correct types
    result.forEach(product => {
      expect(product.id).toBeDefined();
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.sku).toBe('string');
      expect(typeof product.stock_level).toBe('number');
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return products with correct data values', async () => {
    // Create single test product
    const testProduct = testProducts[0];
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        sku: testProduct.sku,
        stock_level: testProduct.stock_level
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    
    const product = result[0];
    expect(product.name).toBe('Zebra Product');
    expect(product.sku).toBe('ZEB-001');
    expect(product.stock_level).toBe(50);
    expect(product.id).toBeGreaterThan(0);
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });

  it('should handle products with zero stock level', async () => {
    // Create product with zero stock
    const zeroStockProduct = testProducts[2]; // Beta Product has 0 stock
    await db.insert(productsTable)
      .values({
        name: zeroStockProduct.name,
        sku: zeroStockProduct.sku,
        stock_level: zeroStockProduct.stock_level
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].stock_level).toBe(0);
    expect(result[0].name).toBe('Beta Product');
  });

  it('should verify database persistence', async () => {
    // Create a product
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TST-001',
        stock_level: 25
      })
      .execute();

    // Fetch via handler
    const handlerResult = await getProducts();
    
    // Fetch directly from database
    const dbResult = await db.select()
      .from(productsTable)
      .execute();

    // Should match exactly
    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);
    expect(handlerResult[0].id).toBe(dbResult[0].id);
    expect(handlerResult[0].name).toBe(dbResult[0].name);
    expect(handlerResult[0].sku).toBe(dbResult[0].sku);
    expect(handlerResult[0].stock_level).toBe(dbResult[0].stock_level);
  });
});
