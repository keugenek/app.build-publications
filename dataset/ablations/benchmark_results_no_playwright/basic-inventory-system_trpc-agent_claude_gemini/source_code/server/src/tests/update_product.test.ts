import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Helper function to create a test product
const createTestProduct = async (productData: CreateProductInput) => {
  const result = await db.insert(productsTable)
    .values({
      name: productData.name,
      sku: productData.sku,
      description: productData.description || null,
      stock_level: productData.initial_stock || 0
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
    const testProduct = await createTestProduct({
      name: 'Original Product',
      sku: 'ORIG-001',
      description: 'Original description',
      initial_stock: 10
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(testProduct.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.sku).toEqual('ORIG-001'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.stock_level).toEqual(10); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testProduct.updated_at).toBe(true);
  });

  it('should update product SKU', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'OLD-001',
      description: 'Test description',
      initial_stock: 5
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      sku: 'NEW-001'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(testProduct.id);
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.sku).toEqual('NEW-001');
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.stock_level).toEqual(5); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update product description', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'Old description',
      initial_stock: 15
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      description: 'New updated description'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(testProduct.id);
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.sku).toEqual('TEST-001'); // Should remain unchanged
    expect(result.description).toEqual('New updated description');
    expect(result.stock_level).toEqual(15); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Original Product',
      sku: 'ORIG-001',
      description: 'Original description',
      initial_stock: 20
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Completely Updated Product',
      sku: 'UPDATED-001',
      description: 'Completely updated description'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(testProduct.id);
    expect(result.name).toEqual('Completely Updated Product');
    expect(result.sku).toEqual('UPDATED-001');
    expect(result.description).toEqual('Completely updated description');
    expect(result.stock_level).toEqual(20); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testProduct.updated_at).toBe(true);
  });

  it('should set description to null when provided', async () => {
    // Create test product with description
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'Has description',
      initial_stock: 0
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      description: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.sku).toEqual('TEST-001'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Original Name',
      sku: 'ORIG-001',
      description: 'Original description',
      initial_stock: 25
    });

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Database Updated Name',
      sku: 'DB-UPDATED-001'
    };

    await updateProduct(updateInput);

    // Verify changes were persisted
    const persistedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct.id))
      .execute();

    expect(persistedProducts).toHaveLength(1);
    expect(persistedProducts[0].name).toEqual('Database Updated Name');
    expect(persistedProducts[0].sku).toEqual('DB-UPDATED-001');
    expect(persistedProducts[0].description).toEqual('Original description');
    expect(persistedProducts[0].stock_level).toEqual(25);
    expect(persistedProducts[0].updated_at).toBeInstanceOf(Date);
    expect(persistedProducts[0].updated_at > testProduct.updated_at).toBe(true);
  });

  it('should throw error when product does not exist', async () => {
    const updateInput: UpdateProductInput = {
      id: 999, // Non-existent ID
      name: 'Should Not Update'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/Product with ID 999 not found/i);
  });

  it('should throw error when SKU already exists for different product', async () => {
    // Create two test products
    const product1 = await createTestProduct({
      name: 'Product One',
      sku: 'UNIQUE-001',
      description: 'First product',
      initial_stock: 10
    });

    const product2 = await createTestProduct({
      name: 'Product Two',
      sku: 'UNIQUE-002',
      description: 'Second product',
      initial_stock: 20
    });

    // Try to update product2 with product1's SKU
    const updateInput: UpdateProductInput = {
      id: product2.id,
      sku: 'UNIQUE-001' // This SKU already exists for product1
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/Product with SKU 'UNIQUE-001' already exists/i);
  });

  it('should allow updating product with same SKU', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Test Product',
      sku: 'SAME-001',
      description: 'Test description',
      initial_stock: 5
    });

    // Update the product with the same SKU (should be allowed)
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Name',
      sku: 'SAME-001' // Same SKU as existing
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.sku).toEqual('SAME-001');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testProduct.updated_at).toBe(true);
  });

  it('should update timestamp correctly', async () => {
    // Create test product
    const testProduct = await createTestProduct({
      name: 'Timestamp Test',
      sku: 'TIME-001',
      description: 'Testing timestamps',
      initial_stock: 0
    });

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Timestamp Test'
    };

    const result = await updateProduct(updateInput);

    expect(result.created_at).toEqual(testProduct.created_at); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testProduct.updated_at.getTime());
  });
});
