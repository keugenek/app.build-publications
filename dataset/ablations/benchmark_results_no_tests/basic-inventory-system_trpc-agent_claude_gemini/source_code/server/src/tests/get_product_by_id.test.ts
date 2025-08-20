import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';
import { eq } from 'drizzle-orm';

// Test product data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_level: 50
};

const secondTestProduct: CreateProductInput = {
  name: 'Another Product',
  sku: 'TEST-002',
  stock_level: 25
};

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product when it exists', async () => {
    // Create a test product in the database
    const insertResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        sku: testProduct.sku,
        stock_level: testProduct.stock_level
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Fetch the product by ID
    const result = await getProductById(createdProduct.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Test Product');
    expect(result!.sku).toEqual('TEST-001');
    expect(result!.stock_level).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product does not exist', async () => {
    // Try to fetch a non-existent product
    const result = await getProductById(999);

    // Should return null
    expect(result).toBeNull();
  });

  it('should return the correct product when multiple products exist', async () => {
    // Create multiple products
    const firstProduct = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        sku: testProduct.sku,
        stock_level: testProduct.stock_level
      })
      .returning()
      .execute();

    const secondProduct = await db.insert(productsTable)
      .values({
        name: secondTestProduct.name,
        sku: secondTestProduct.sku,
        stock_level: secondTestProduct.stock_level
      })
      .returning()
      .execute();

    // Fetch the second product specifically
    const result = await getProductById(secondProduct[0].id);

    // Verify we got the correct product
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondProduct[0].id);
    expect(result!.name).toEqual('Another Product');
    expect(result!.sku).toEqual('TEST-002');
    expect(result!.stock_level).toEqual(25);
    
    // Verify it's not the first product
    expect(result!.id).not.toEqual(firstProduct[0].id);
  });

  it('should handle negative IDs gracefully', async () => {
    // Try to fetch with negative ID
    const result = await getProductById(-1);

    // Should return null
    expect(result).toBeNull();
  });

  it('should handle zero ID gracefully', async () => {
    // Try to fetch with zero ID
    const result = await getProductById(0);

    // Should return null (since serial IDs start from 1)
    expect(result).toBeNull();
  });

  it('should verify database consistency after fetch', async () => {
    // Create a test product
    const insertResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        sku: testProduct.sku,
        stock_level: testProduct.stock_level
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Fetch the product using the handler
    const handlerResult = await getProductById(createdProduct.id);

    // Also fetch directly from database to compare
    const directResult = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    // Both should return the same data
    expect(handlerResult).not.toBeNull();
    expect(directResult).toHaveLength(1);
    expect(handlerResult!.id).toEqual(directResult[0].id);
    expect(handlerResult!.name).toEqual(directResult[0].name);
    expect(handlerResult!.sku).toEqual(directResult[0].sku);
    expect(handlerResult!.stock_level).toEqual(directResult[0].stock_level);
  });
});
