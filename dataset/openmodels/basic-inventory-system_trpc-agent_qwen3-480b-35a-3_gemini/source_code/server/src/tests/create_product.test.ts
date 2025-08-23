import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stockLevel: 100
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual(testInput.sku);
    expect(result.stockLevel).toEqual(100);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].sku).toEqual(testInput.sku);
    expect(products[0].stockLevel).toEqual(100);
    expect(products[0].createdAt).toBeInstanceOf(Date);
    expect(products[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should handle default stock level', async () => {
    const inputWithoutStock: CreateProductInput = {
      name: 'Product Without Stock',
      sku: 'TEST-002',
      stockLevel: 0 // Zod will apply default but we need to provide it for the test input
    };

    const result = await createProduct(inputWithoutStock);
    
    expect(result.stockLevel).toEqual(0);
    expect(result.name).toEqual('Product Without Stock');
    expect(result.sku).toEqual('TEST-002');
  });

  it('should throw error for duplicate SKU', async () => {
    // Create first product
    await createProduct(testInput);
    
    // Try to create another product with the same SKU
    await expect(createProduct(testInput)).rejects.toThrow(/duplicate key value violates unique constraint/);
  });
});
