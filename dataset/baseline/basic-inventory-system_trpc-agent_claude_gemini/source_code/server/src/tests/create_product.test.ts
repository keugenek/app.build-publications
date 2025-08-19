import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  name: 'Test Widget',
  sku: 'TW-001',
  stock_level: 50
};

// Test input with default stock level
const testInputWithDefaults: CreateProductInput = {
  name: 'Basic Widget',
  sku: 'BW-001',
  stock_level: 0 // Explicitly include default value
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Validate all returned fields
    expect(result.name).toEqual('Test Widget');
    expect(result.sku).toEqual('TW-001');
    expect(result.stock_level).toEqual(50);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with default stock level', async () => {
    const result = await createProduct(testInputWithDefaults);

    expect(result.name).toEqual('Basic Widget');
    expect(result.sku).toEqual('BW-001');
    expect(result.stock_level).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Verify product was saved to database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Widget');
    expect(savedProduct.sku).toEqual('TW-001');
    expect(savedProduct.stock_level).toEqual(50);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should enforce SKU uniqueness', async () => {
    // Create first product
    await createProduct(testInput);

    // Attempt to create second product with same SKU
    const duplicateInput: CreateProductInput = {
      name: 'Different Widget',
      sku: 'TW-001', // Same SKU as first product
      stock_level: 25
    };

    await expect(createProduct(duplicateInput))
      .rejects
      .toThrow(/already exists/i);
  });

  it('should allow different SKUs for different products', async () => {
    // Create first product
    const product1 = await createProduct(testInput);

    // Create second product with different SKU
    const differentInput: CreateProductInput = {
      name: 'Another Widget',
      sku: 'AW-002', // Different SKU
      stock_level: 75
    };

    const product2 = await createProduct(differentInput);

    // Both should be created successfully
    expect(product1.id).not.toEqual(product2.id);
    expect(product1.sku).toEqual('TW-001');
    expect(product2.sku).toEqual('AW-002');

    // Verify both exist in database
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(2);
  });

  it('should handle zero stock level correctly', async () => {
    const zeroStockInput: CreateProductInput = {
      name: 'Zero Stock Widget',
      sku: 'ZS-001',
      stock_level: 0
    };

    const result = await createProduct(zeroStockInput);

    expect(result.stock_level).toEqual(0);
    expect(typeof result.stock_level).toBe('number');
  });

  it('should validate that created_at and updated_at are set', async () => {
    const result = await createProduct(testInput);
    
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - result.created_at.getTime());
    
    // Should be created within the last minute
    expect(timeDiff).toBeLessThan(60000);
    expect(result.created_at).toEqual(result.updated_at);
  });
});
