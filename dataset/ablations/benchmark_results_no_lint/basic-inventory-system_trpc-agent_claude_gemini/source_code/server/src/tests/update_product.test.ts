import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product
  const createTestProduct = async (data: CreateProductInput) => {
    const result = await db.insert(productsTable)
      .values({
        name: data.name,
        sku: data.sku,
        stock_level: data.stock_level
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update a product name', async () => {
    const testProduct = await createTestProduct({
      name: 'Original Product',
      sku: 'SKU001',
      stock_level: 50
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testProduct.id);
    expect(result!.name).toEqual('Updated Product Name');
    expect(result!.sku).toEqual('SKU001'); // Unchanged
    expect(result!.stock_level).toEqual(50); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > testProduct.updated_at).toBe(true);
  });

  it('should update a product SKU', async () => {
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SKU001',
      stock_level: 25
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      sku: 'NEW-SKU-001'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testProduct.id);
    expect(result!.name).toEqual('Test Product'); // Unchanged
    expect(result!.sku).toEqual('NEW-SKU-001');
    expect(result!.stock_level).toEqual(25); // Unchanged
  });

  it('should update stock level', async () => {
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SKU001',
      stock_level: 100
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      stock_level: 150
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testProduct.id);
    expect(result!.name).toEqual('Test Product'); // Unchanged
    expect(result!.sku).toEqual('SKU001'); // Unchanged
    expect(result!.stock_level).toEqual(150);
  });

  it('should update multiple fields at once', async () => {
    const testProduct = await createTestProduct({
      name: 'Original Product',
      sku: 'OLD-SKU',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Completely Updated Product',
      sku: 'BRAND-NEW-SKU',
      stock_level: 75
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testProduct.id);
    expect(result!.name).toEqual('Completely Updated Product');
    expect(result!.sku).toEqual('BRAND-NEW-SKU');
    expect(result!.stock_level).toEqual(75);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SKU001',
      stock_level: 30
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Database Test Product',
      stock_level: 90
    };

    await updateProduct(updateInput);

    // Verify changes were persisted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test Product');
    expect(products[0].sku).toEqual('SKU001'); // Unchanged
    expect(products[0].stock_level).toEqual(90);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'This Should Not Work'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeNull();
  });

  it('should reject duplicate SKU', async () => {
    // Create two products
    const product1 = await createTestProduct({
      name: 'Product 1',
      sku: 'UNIQUE-SKU-1',
      stock_level: 10
    });

    const product2 = await createTestProduct({
      name: 'Product 2',
      sku: 'UNIQUE-SKU-2',
      stock_level: 20
    });

    // Try to update product2's SKU to match product1's SKU
    const updateInput: UpdateProductInput = {
      id: product2.id,
      sku: 'UNIQUE-SKU-1' // This should conflict
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/SKU 'UNIQUE-SKU-1' already exists/i);
  });

  it('should allow updating product to same SKU it already has', async () => {
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SAME-SKU',
      stock_level: 40
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Name',
      sku: 'SAME-SKU' // Same SKU it already has
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Updated Name');
    expect(result!.sku).toEqual('SAME-SKU');
  });

  it('should handle zero stock level update', async () => {
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SKU001',
      stock_level: 100
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      stock_level: 0
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeDefined();
    expect(result!.stock_level).toEqual(0);
  });
});
