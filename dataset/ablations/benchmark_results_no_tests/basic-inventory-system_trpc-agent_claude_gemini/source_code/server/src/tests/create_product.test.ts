import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_level: 100
};

const minimalInput: CreateProductInput = {
  name: 'Minimal Product',
  sku: 'MIN-001',
  stock_level: 0 // Explicitly set to test default behavior
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Verify returned product structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual('TEST-001');
    expect(result.stock_level).toEqual(100);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with default stock level', async () => {
    const result = await createProduct(minimalInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.sku).toEqual('MIN-001');
    expect(result.stock_level).toEqual(0); // Should use default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Query the database to verify the product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.sku).toEqual('TEST-001');
    expect(savedProduct.stock_level).toEqual(100);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle SKU uniqueness constraint', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with the same SKU
    const duplicateSKUInput: CreateProductInput = {
      name: 'Duplicate SKU Product',
      sku: 'TEST-001', // Same SKU as first product
      stock_level: 50
    };

    // Should throw error due to unique constraint violation
    await expect(createProduct(duplicateSKUInput)).rejects.toThrow(/unique/i);
  });

  it('should handle multiple products with different SKUs', async () => {
    const product1Input: CreateProductInput = {
      name: 'Product 1',
      sku: 'PROD-001',
      stock_level: 10
    };

    const product2Input: CreateProductInput = {
      name: 'Product 2', 
      sku: 'PROD-002',
      stock_level: 20
    };

    // Create both products
    const result1 = await createProduct(product1Input);
    const result2 = await createProduct(product2Input);

    // Verify both products were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.sku).toEqual('PROD-001');
    expect(result2.sku).toEqual('PROD-002');

    // Verify both are in database
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(2);
    expect(allProducts.map(p => p.sku)).toContain('PROD-001');
    expect(allProducts.map(p => p.sku)).toContain('PROD-002');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createProduct(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // For new products, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});
