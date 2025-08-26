import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';
import { type CreateProductInput } from '../schema';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();

    expect(result).toEqual([]);
  });

  it('should return all products from database', async () => {
    // Create test products directly in database
    const testProducts = [
      {
        name: 'Product One',
        sku: 'SKU-001',
        stock_level: 50
      },
      {
        name: 'Product Two',
        sku: 'SKU-002',
        stock_level: 25
      },
      {
        name: 'Product Three',
        sku: 'SKU-003',
        stock_level: 0
      }
    ];

    // Insert products into database
    await db.insert(productsTable)
      .values(testProducts)
      .execute();

    const result = await getProducts();

    // Should return all products
    expect(result).toHaveLength(3);

    // Verify product data is correctly returned
    expect(result[0].name).toEqual('Product One');
    expect(result[0].sku).toEqual('SKU-001');
    expect(result[0].stock_level).toEqual(50);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Product Two');
    expect(result[1].sku).toEqual('SKU-002');
    expect(result[1].stock_level).toEqual(25);

    expect(result[2].name).toEqual('Product Three');
    expect(result[2].sku).toEqual('SKU-003');
    expect(result[2].stock_level).toEqual(0);
  });

  it('should return products with correct data types', async () => {
    // Create a single test product
    const testProduct = {
      name: 'Test Product',
      sku: 'TEST-SKU',
      stock_level: 100
    };

    await db.insert(productsTable)
      .values([testProduct])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);

    const product = result[0];
    
    // Verify all field types are correct
    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.sku).toBe('string');
    expect(typeof product.stock_level).toBe('number');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });

  it('should return products in consistent order', async () => {
    // Create multiple products to test ordering
    const testProducts = [
      { name: 'Zebra Product', sku: 'Z-001', stock_level: 1 },
      { name: 'Alpha Product', sku: 'A-001', stock_level: 2 },
      { name: 'Beta Product', sku: 'B-001', stock_level: 3 }
    ];

    await db.insert(productsTable)
      .values(testProducts)
      .execute();

    const result1 = await getProducts();
    const result2 = await getProducts();

    // Results should be consistent across multiple calls
    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
    
    // Order should be the same (likely by id ascending due to serial primary key)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].id).toEqual(result2[i].id);
      expect(result1[i].name).toEqual(result2[i].name);
      expect(result1[i].sku).toEqual(result2[i].sku);
    }
  });

  it('should handle products with various stock levels', async () => {
    // Test products with different stock scenarios
    const testProducts = [
      { name: 'Out of Stock', sku: 'OOS-001', stock_level: 0 },
      { name: 'Low Stock', sku: 'LOW-001', stock_level: 5 },
      { name: 'High Stock', sku: 'HIGH-001', stock_level: 1000 }
    ];

    await db.insert(productsTable)
      .values(testProducts)
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(3);

    // Find each product and verify stock levels
    const outOfStock = result.find(p => p.sku === 'OOS-001');
    const lowStock = result.find(p => p.sku === 'LOW-001');
    const highStock = result.find(p => p.sku === 'HIGH-001');

    expect(outOfStock).toBeDefined();
    expect(outOfStock!.stock_level).toEqual(0);

    expect(lowStock).toBeDefined();
    expect(lowStock!.stock_level).toEqual(5);

    expect(highStock).toBeDefined();
    expect(highStock!.stock_level).toEqual(1000);
  });
});
