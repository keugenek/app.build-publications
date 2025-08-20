import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProduct } from '../handlers/get_product';

// Test input for creating a product
const testInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_quantity: 50
};

describe('getProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product for fetching
    await db.insert(productsTable).values(testInput).execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing product by ID', async () => {
    // First get the product ID from the database
    const products = await db.select().from(productsTable).execute();
    const productId = products[0].id;
    
    const result = await getProduct(productId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('Test Product');
    expect(result!.sku).toEqual('TEST-001');
    expect(result!.stock_quantity).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product ID', async () => {
    const result = await getProduct(99999);
    expect(result).toBeNull();
  });

  it('should handle product with zero stock quantity', async () => {
    // Create a product with zero stock
    const result = await db.insert(productsTable)
      .values({
        name: 'Zero Stock Product',
        sku: 'ZERO-001',
        stock_quantity: 0
      })
      .returning()
      .execute();
      
    const productId = result[0].id;
    
    const product = await getProduct(productId);
    
    expect(product).not.toBeNull();
    expect(product!.stock_quantity).toEqual(0);
  });
});
