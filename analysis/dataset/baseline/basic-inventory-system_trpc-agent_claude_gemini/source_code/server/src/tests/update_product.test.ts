import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

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

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update product name', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Original Product',
      sku: 'ORIG-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.sku).toEqual('ORIG-001'); // Should remain unchanged
    expect(result.stock_level).toEqual(10); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > product.updated_at).toBe(true);
  });

  it('should update product SKU', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product',
      sku: 'ORIG-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      sku: 'UPDATED-001'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.sku).toEqual('UPDATED-001');
    expect(result.stock_level).toEqual(10); // Should remain unchanged
  });

  it('should update stock level', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      stock_level: 25
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.sku).toEqual('TEST-001'); // Should remain unchanged
    expect(result.stock_level).toEqual(25);
  });

  it('should update multiple fields at once', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Original Product',
      sku: 'ORIG-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Completely Updated Product',
      sku: 'UPDATED-001',
      stock_level: 50
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Completely Updated Product');
    expect(result.sku).toEqual('UPDATED-001');
    expect(result.stock_level).toEqual(50);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Original Product',
      sku: 'ORIG-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product',
      stock_level: 20
    };

    await updateProduct(updateInput);

    // Verify changes were persisted
    const savedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(savedProduct).toHaveLength(1);
    expect(savedProduct[0].name).toEqual('Updated Product');
    expect(savedProduct[0].sku).toEqual('ORIG-001'); // Unchanged
    expect(savedProduct[0].stock_level).toEqual(20);
    expect(savedProduct[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should throw error when SKU already exists for another product', async () => {
    // Create first product
    const product1 = await createTestProduct({
      name: 'Product 1',
      sku: 'EXISTING-SKU',
      stock_level: 10
    });

    // Create second product
    const product2 = await createTestProduct({
      name: 'Product 2',
      sku: 'ANOTHER-SKU',
      stock_level: 15
    });

    // Try to update product2 with product1's SKU
    const updateInput: UpdateProductInput = {
      id: product2.id,
      sku: 'EXISTING-SKU' // This should conflict
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/SKU 'EXISTING-SKU' already exists for another product/i);
  });

  it('should allow updating product with its own SKU', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-SKU',
      stock_level: 10
    });

    // Update with same SKU (should be allowed)
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Name',
      sku: 'TEST-SKU' // Same SKU
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.sku).toEqual('TEST-SKU');
  });

  it('should handle stock level zero', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-001',
      stock_level: 10
    });

    const updateInput: UpdateProductInput = {
      id: product.id,
      stock_level: 0 // Set to zero
    };

    const result = await updateProduct(updateInput);

    expect(result.stock_level).toEqual(0);
  });

  it('should update only updated_at when no fields are changed', async () => {
    // Create test product
    const product = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-001',
      stock_level: 10
    });

    const originalUpdatedAt = product.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProductInput = {
      id: product.id
      // No fields to update, but updated_at should still change
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Test Product'); // Unchanged
    expect(result.sku).toEqual('TEST-001'); // Unchanged
    expect(result.stock_level).toEqual(10); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
