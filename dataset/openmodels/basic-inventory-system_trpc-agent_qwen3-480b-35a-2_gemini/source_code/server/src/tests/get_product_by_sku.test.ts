import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getProductBySku } from '../handlers/get_product_by_sku';

describe('getProductBySku', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch an existing product by SKU', async () => {
    // Create a test product directly in database
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 50
      })
      .returning()
      .execute();
    
    const createdProduct = result[0];
    
    // Fetch the product by SKU
    const fetchedProduct = await getProductBySku('TEST-001');
    
    // Verify the fetched product matches what we created
    expect(fetchedProduct).not.toBeNull();
    expect(fetchedProduct!.id).toEqual(createdProduct.id);
    expect(fetchedProduct!.name).toEqual('Test Product');
    expect(fetchedProduct!.sku).toEqual('TEST-001');
    expect(fetchedProduct!.stock_level).toEqual(50);
    expect(fetchedProduct!.created_at).toBeInstanceOf(Date);
    expect(fetchedProduct!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent SKU', async () => {
    const result = await getProductBySku('NON-EXISTENT');
    expect(result).toBeNull();
  });

  it('should handle special characters in SKU correctly', async () => {
    // Create a product with special characters in SKU
    await db.insert(productsTable)
      .values({
        name: 'Special Product',
        sku: 'SP-001/TEST_01',
        stock_level: 25
      })
      .returning()
      .execute();
    
    // Fetch the product by SKU
    const fetchedProduct = await getProductBySku('SP-001/TEST_01');
    
    expect(fetchedProduct).not.toBeNull();
    expect(fetchedProduct!.sku).toEqual('SP-001/TEST_01');
  });

  it('should return the correct product when multiple products exist', async () => {
    // Create multiple products
    await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 10
      })
      .returning()
      .execute();

    const result2 = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        stock_level: 20
      })
      .returning()
      .execute();
    
    const createdProduct2 = result2[0];
    
    // Fetch specifically the second product
    const fetchedProduct = await getProductBySku('PROD-002');
    
    expect(fetchedProduct).not.toBeNull();
    expect(fetchedProduct!.id).toEqual(createdProduct2.id);
    expect(fetchedProduct!.sku).toEqual('PROD-002');
    expect(fetchedProduct!.name).toEqual('Product 2');
  });
});
