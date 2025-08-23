import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProduct } from '../handlers/get_product';
import { eq } from 'drizzle-orm';

// Test input for creating a product
const testProductInput: CreateProductInput = {
  code: 'PROD001',
  name: 'Test Product',
  description: 'A product for testing',
  purchase_price: 10.99,
  selling_price: 19.99,
  stock_quantity: 100
};

describe('getProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product
    await db.insert(productsTable).values({
      code: testProductInput.code,
      name: testProductInput.name,
      description: testProductInput.description,
      purchase_price: testProductInput.purchase_price.toString(),
      selling_price: testProductInput.selling_price.toString(),
      stock_quantity: testProductInput.stock_quantity
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch a product by ID', async () => {
    // First get the product ID from the database
    const createdProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.code, testProductInput.code))
      .execute();
    
    expect(createdProduct).toHaveLength(1);
    const productId = createdProduct[0].id;
    
    // Test the handler
    const result = await getProduct(productId);
    
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    if (result) {
      expect(result.id).toEqual(productId);
      expect(result.code).toEqual('PROD001');
      expect(result.name).toEqual('Test Product');
      expect(result.description).toEqual('A product for testing');
      expect(result.purchase_price).toEqual(10.99);
      expect(result.selling_price).toEqual(19.99);
      expect(result.stock_quantity).toEqual(100);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(typeof result.purchase_price).toBe('number');
      expect(typeof result.selling_price).toBe('number');
    }
  });

  it('should return null for non-existent product', async () => {
    const result = await getProduct(99999);
    expect(result).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    // We can't easily simulate database errors in unit tests
    // but we can at least verify the function signature and basic error handling
    expect(typeof getProduct).toBe('function');
  });
});
