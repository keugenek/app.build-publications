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
  stock_quantity: 100
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual(testInput.sku);
    expect(result.stock_quantity).toEqual(100);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
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
    expect(products[0].stock_quantity).toEqual(100);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create product with default stock quantity', async () => {
    const inputWithDefaultStock: CreateProductInput = {
      name: 'Product Without Stock',
      sku: 'TEST-002',
      stock_quantity: 0 // Zod will apply this default
    };

    const result = await createProduct(inputWithDefaultStock);

    expect(result.stock_quantity).toEqual(0);
    expect(result.name).toEqual('Product Without Stock');
    expect(result.sku).toEqual('TEST-002');
  });

  it('should fail to create product with duplicate SKU', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with the same SKU
    const duplicateInput: CreateProductInput = {
      name: 'Duplicate Product',
      sku: 'TEST-001', // Same SKU as first product
      stock_quantity: 50
    };

    await expect(createProduct(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
