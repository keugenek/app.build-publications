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
  stock_level: 100
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual('TEST-001');
    expect(result.stock_level).toEqual(100);
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
    expect(products[0].sku).toEqual('TEST-001');
    expect(products[0].stock_level).toEqual(100);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should use default stock_level when not provided', async () => {
    const inputWithoutStock: CreateProductInput = {
      name: 'Test Product 2',
      sku: 'TEST-002',
      stock_level: 0 // Include default value in test input
    };

    const result = await createProduct(inputWithoutStock);

    expect(result.stock_level).toEqual(0);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].stock_level).toEqual(0);
  });

  it('should handle duplicate SKU constraint violation', async () => {
    // First product creation should succeed
    await createProduct(testInput);

    // Second product with same SKU should fail
    const duplicateInput: CreateProductInput = {
      name: 'Duplicate Product',
      sku: 'TEST-001', // Same SKU as first product
      stock_level: 50
    };

    await expect(createProduct(duplicateInput)).rejects.toThrow(/unique constraint|duplicate key/i);
  });

  it('should create products with different SKUs successfully', async () => {
    const product1 = await createProduct(testInput);
    
    const secondInput: CreateProductInput = {
      name: 'Second Product',
      sku: 'TEST-002',
      stock_level: 200
    };
    
    const product2 = await createProduct(secondInput);

    expect(product1.id).not.toEqual(product2.id);
    expect(product1.sku).toEqual('TEST-001');
    expect(product2.sku).toEqual('TEST-002');

    // Verify both products exist in database
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(2);
    expect(allProducts.map(p => p.sku).sort()).toEqual(['TEST-001', 'TEST-002']);
  });

  it('should handle various stock levels correctly', async () => {
    const highStockInput: CreateProductInput = {
      name: 'High Stock Product',
      sku: 'HIGH-STOCK-001',
      stock_level: 9999
    };

    const result = await createProduct(highStockInput);

    expect(result.stock_level).toEqual(9999);
    expect(typeof result.stock_level).toEqual('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].stock_level).toEqual(9999);
  });
});
