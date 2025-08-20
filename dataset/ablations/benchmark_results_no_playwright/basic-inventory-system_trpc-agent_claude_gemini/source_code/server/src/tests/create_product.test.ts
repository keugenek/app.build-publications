import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  description: 'A product for testing purposes',
  initial_stock: 50
};

// Minimal test input (relies on defaults)
const minimalInput: CreateProductInput = {
  name: 'Minimal Product',
  sku: 'MIN-001',
  initial_stock: 0 // Explicitly set default value
  // description will use default (undefined)
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual('TEST-001');
    expect(result.description).toEqual('A product for testing purposes');
    expect(result.stock_level).toEqual(50);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields and apply defaults', async () => {
    const result = await createProduct(minimalInput);

    // Verify defaults are applied
    expect(result.name).toEqual('Minimal Product');
    expect(result.sku).toEqual('MIN-001');
    expect(result.description).toBeNull();
    expect(result.stock_level).toEqual(0); // Default from Zod schema
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
    expect(savedProduct.description).toEqual('A product for testing purposes');
    expect(savedProduct.stock_level).toEqual(50);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreateProductInput = {
      name: 'No Description Product',
      sku: 'NO-DESC-001',
      description: null,
      initial_stock: 10
    };

    const result = await createProduct(inputWithNullDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].description).toBeNull();
  });

  it('should enforce unique SKU constraint', async () => {
    // Create first product
    await createProduct(testInput);

    // Attempt to create second product with same SKU
    const duplicateSkuInput: CreateProductInput = {
      name: 'Duplicate SKU Product',
      sku: 'TEST-001', // Same SKU as testInput
      description: 'This should fail',
      initial_stock: 25
    };

    // Should throw error due to unique constraint violation
    await expect(createProduct(duplicateSkuInput)).rejects.toThrow();
  });

  it('should handle zero initial stock correctly', async () => {
    const zeroStockInput: CreateProductInput = {
      name: 'Zero Stock Product',
      sku: 'ZERO-001',
      description: 'Product with zero stock',
      initial_stock: 0
    };

    const result = await createProduct(zeroStockInput);

    expect(result.stock_level).toEqual(0);
    expect(typeof result.stock_level).toBe('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].stock_level).toEqual(0);
  });

  it('should create multiple products with different SKUs', async () => {
    const product1: CreateProductInput = {
      name: 'Product One',
      sku: 'PROD-001',
      description: 'First product',
      initial_stock: 100
    };

    const product2: CreateProductInput = {
      name: 'Product Two',
      sku: 'PROD-002',
      description: 'Second product',
      initial_stock: 200
    };

    const result1 = await createProduct(product1);
    const result2 = await createProduct(product2);

    // Both should be created successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.sku).toEqual('PROD-001');
    expect(result2.sku).toEqual('PROD-002');

    // Verify both exist in database
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(2);
    
    const skus = allProducts.map(p => p.sku).sort();
    expect(skus).toEqual(['PROD-001', 'PROD-002']);
  });
});
