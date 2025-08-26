import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-SKU-001',
  stock_level: 50
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.sku).toEqual('TEST-SKU-001');
    expect(result.stock_level).toEqual(50);
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
    expect(products[0].sku).toEqual('TEST-SKU-001');
    expect(products[0].stock_level).toEqual(50);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create product with explicit zero stock level', async () => {
    const inputWithoutStock: CreateProductInput = {
      name: 'Product without stock',
      sku: 'TEST-SKU-002',
      stock_level: 0 // Zod default is 0, so we explicitly set it
    };

    const result = await createProduct(inputWithoutStock);
    
    expect(result.name).toEqual('Product without stock');
    expect(result.sku).toEqual('TEST-SKU-002');
    expect(result.stock_level).toEqual(0); // Default value
    expect(result.id).toBeDefined();
  });

  it('should handle creating products with same name but different SKUs', async () => {
    const input1: CreateProductInput = {
      name: 'Same Name Product',
      sku: 'SAME-NAME-001',
      stock_level: 10
    };

    const input2: CreateProductInput = {
      name: 'Same Name Product',
      sku: 'SAME-NAME-002',
      stock_level: 20
    };

    const result1 = await createProduct(input1);
    const result2 = await createProduct(input2);

    expect(result1.name).toEqual(result2.name);
    expect(result1.sku).not.toEqual(result2.sku);
    expect(result1.id).not.toEqual(result2.id);
  });
});
