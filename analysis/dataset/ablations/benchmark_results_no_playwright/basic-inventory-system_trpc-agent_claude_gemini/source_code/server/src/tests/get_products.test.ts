import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no products exist', async () => {
    const result = await getProducts();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should return a single product', async () => {
    // Create a test product
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A product for testing',
        stock_level: 50
      })
      .execute();

    const result = await getProducts();

    expect(result.length).toBe(1);
    expect(result[0].name).toEqual('Test Product');
    expect(result[0].sku).toEqual('TEST-001');
    expect(result[0].description).toEqual('A product for testing');
    expect(result[0].stock_level).toEqual(50);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple products in order', async () => {
    // Create multiple test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Product A',
          sku: 'PROD-A',
          description: 'First product',
          stock_level: 10
        },
        {
          name: 'Product B',
          sku: 'PROD-B',
          description: 'Second product',
          stock_level: 20
        },
        {
          name: 'Product C',
          sku: 'PROD-C',
          description: null, // Test nullable description
          stock_level: 0
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result.length).toBe(3);
    
    // Verify all products are returned with correct data
    const productNames = result.map(p => p.name).sort();
    expect(productNames).toEqual(['Product A', 'Product B', 'Product C']);

    // Verify nullable description is handled correctly
    const productC = result.find(p => p.name === 'Product C');
    expect(productC?.description).toBeNull();

    // Verify zero stock level is handled correctly
    expect(productC?.stock_level).toBe(0);
  });

  it('should handle products with various stock levels', async () => {
    // Create products with different stock levels
    await db.insert(productsTable)
      .values([
        {
          name: 'Out of Stock',
          sku: 'OOS-001',
          description: 'No stock',
          stock_level: 0
        },
        {
          name: 'Low Stock',
          sku: 'LOW-001',
          description: 'Limited stock',
          stock_level: 5
        },
        {
          name: 'High Stock',
          sku: 'HIGH-001',
          description: 'Plenty of stock',
          stock_level: 1000
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result.length).toBe(3);
    
    // Verify stock levels are correctly preserved
    const stockLevels = result.map(p => p.stock_level).sort((a, b) => a - b);
    expect(stockLevels).toEqual([0, 5, 1000]);

    // Verify each product has the correct stock level
    const outOfStock = result.find(p => p.name === 'Out of Stock');
    const lowStock = result.find(p => p.name === 'Low Stock');
    const highStock = result.find(p => p.name === 'High Stock');

    expect(outOfStock?.stock_level).toBe(0);
    expect(lowStock?.stock_level).toBe(5);
    expect(highStock?.stock_level).toBe(1000);
  });

  it('should return products with proper date objects', async () => {
    await db.insert(productsTable)
      .values({
        name: 'Date Test Product',
        sku: 'DATE-001',
        description: 'Testing date conversion',
        stock_level: 25
      })
      .execute();

    const result = await getProducts();

    expect(result.length).toBe(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Verify dates are reasonable (within the last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result[0].created_at >= oneMinuteAgo).toBe(true);
    expect(result[0].created_at <= now).toBe(true);
    expect(result[0].updated_at >= oneMinuteAgo).toBe(true);
    expect(result[0].updated_at <= now).toBe(true);
  });

  it('should handle products with unique SKUs correctly', async () => {
    // Create products with unique SKUs
    await db.insert(productsTable)
      .values([
        {
          name: 'Unique Product 1',
          sku: 'UNQ-001',
          description: 'First unique product',
          stock_level: 15
        },
        {
          name: 'Unique Product 2',
          sku: 'UNQ-002',
          description: 'Second unique product',
          stock_level: 30
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result.length).toBe(2);
    
    // Verify SKUs are unique and correctly assigned
    const skus = result.map(p => p.sku);
    expect(skus).toContain('UNQ-001');
    expect(skus).toContain('UNQ-002');
    expect(new Set(skus).size).toBe(2); // Ensure uniqueness
  });
});
