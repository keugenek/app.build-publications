import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProduct } from '../handlers/get_product';
import { eq } from 'drizzle-orm';

// Test input for creating a product
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-SKU-001',
  stockLevel: 50
};

describe('getProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product to fetch
    await db.insert(productsTable)
      .values({
        name: testInput.name,
        sku: testInput.sku,
        stockLevel: testInput.stockLevel
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing product by ID', async () => {
    // First get the product ID from the database
    const products = await db.select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.sku, testInput.sku))
      .execute();
    
    const productId = products[0].id;
    
    // Fetch the product using our handler
    const result = await getProduct(productId);

    // Validate the returned product
    expect(result.id).toBe(productId);
    expect(result.name).toBe(testInput.name);
    expect(result.sku).toBe(testInput.sku);
    expect(result.stockLevel).toBe(testInput.stockLevel);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw an error when product is not found', async () => {
    // Try to fetch a product that doesn't exist
    const nonExistentId = 99999;
    
    await expect(getProduct(nonExistentId))
      .rejects
      .toThrow(/Product with id 99999 not found/);
  });
});
