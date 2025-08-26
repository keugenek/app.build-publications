import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product when found by id', async () => {
    // Create a test product
    const [createdProduct] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 50
      })
      .returning()
      .execute();

    const result = await getProductById(createdProduct.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdProduct.id);
    expect(result?.name).toEqual('Test Product');
    expect(result?.sku).toEqual('TEST-001');
    expect(result?.stock_level).toEqual(50);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product is not found', async () => {
    const result = await getProductById(999999);
    expect(result).toBeNull();
  });

  it('should return correct product when multiple products exist', async () => {
    // Create multiple test products
    const products = await db.insert(productsTable)
      .values([
        { name: 'Product A', sku: 'PROD-A', stock_level: 10 },
        { name: 'Product B', sku: 'PROD-B', stock_level: 20 },
        { name: 'Product C', sku: 'PROD-C', stock_level: 30 }
      ])
      .returning()
      .execute();

    // Get the second product
    const targetProduct = products[1];
    const result = await getProductById(targetProduct.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(targetProduct.id);
    expect(result?.name).toEqual('Product B');
    expect(result?.sku).toEqual('PROD-B');
    expect(result?.stock_level).toEqual(20);
  });

  it('should return product with correct data types', async () => {
    const [createdProduct] = await db.insert(productsTable)
      .values({
        name: 'Type Test Product',
        sku: 'TYPE-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const result = await getProductById(createdProduct.id);

    expect(result).toBeDefined();
    expect(typeof result?.id).toBe('number');
    expect(typeof result?.name).toBe('string');
    expect(typeof result?.sku).toBe('string');
    expect(typeof result?.stock_level).toBe('number');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should handle zero stock level correctly', async () => {
    const [createdProduct] = await db.insert(productsTable)
      .values({
        name: 'Zero Stock Product',
        sku: 'ZERO-001',
        stock_level: 0
      })
      .returning()
      .execute();

    const result = await getProductById(createdProduct.id);

    expect(result).toBeDefined();
    expect(result?.stock_level).toEqual(0);
  });
});
