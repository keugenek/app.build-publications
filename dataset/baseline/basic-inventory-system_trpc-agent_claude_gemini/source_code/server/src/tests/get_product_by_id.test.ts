import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductByIdInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product when found', async () => {
    // Create a test product
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 50
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Test input
    const testInput: GetProductByIdInput = {
      id: createdProduct.id
    };

    const result = await getProductById(testInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Test Product');
    expect(result!.sku).toEqual('TEST-001');
    expect(result!.stock_level).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product is not found', async () => {
    const testInput: GetProductByIdInput = {
      id: 99999 // Non-existent ID
    };

    const result = await getProductById(testInput);

    expect(result).toBeNull();
  });

  it('should return the correct product when multiple products exist', async () => {
    // Create multiple test products
    const products = await db.insert(productsTable)
      .values([
        { name: 'Product 1', sku: 'PROD-001', stock_level: 10 },
        { name: 'Product 2', sku: 'PROD-002', stock_level: 20 },
        { name: 'Product 3', sku: 'PROD-003', stock_level: 30 }
      ])
      .returning()
      .execute();

    const targetProduct = products[1]; // Get the second product

    const testInput: GetProductByIdInput = {
      id: targetProduct.id
    };

    const result = await getProductById(testInput);

    // Verify we get the correct product
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetProduct.id);
    expect(result!.name).toEqual('Product 2');
    expect(result!.sku).toEqual('PROD-002');
    expect(result!.stock_level).toEqual(20);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle products with zero stock level', async () => {
    // Create a product with zero stock
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Out of Stock Product',
        sku: 'OOS-001',
        stock_level: 0
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    const testInput: GetProductByIdInput = {
      id: createdProduct.id
    };

    const result = await getProductById(testInput);

    expect(result).not.toBeNull();
    expect(result!.stock_level).toEqual(0);
    expect(result!.name).toEqual('Out of Stock Product');
    expect(result!.sku).toEqual('OOS-001');
  });

  it('should preserve all date fields correctly', async () => {
    // Create a test product
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Date Test Product',
        sku: 'DATE-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    const testInput: GetProductByIdInput = {
      id: createdProduct.id
    };

    const result = await getProductById(testInput);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toEqual(createdProduct.created_at.getTime());
    expect(result!.updated_at.getTime()).toEqual(createdProduct.updated_at.getTime());
  });
});
