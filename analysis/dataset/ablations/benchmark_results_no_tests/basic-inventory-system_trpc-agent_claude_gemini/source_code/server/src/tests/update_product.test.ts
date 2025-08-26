import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test product
  const createTestProduct = async (overrides = {}) => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        sku: 'ORIG-001',
        stock_level: 50,
        ...overrides
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update product name only', async () => {
    const product = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Updated Product Name');
    expect(result!.sku).toEqual('ORIG-001'); // Should remain unchanged
    expect(result!.stock_level).toEqual(50); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > product.updated_at).toBe(true);
  });

  it('should update SKU only', async () => {
    const product = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      sku: 'NEW-SKU-001'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Original Product'); // Should remain unchanged
    expect(result!.sku).toEqual('NEW-SKU-001');
    expect(result!.stock_level).toEqual(50); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update stock level only', async () => {
    const product = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      stock_level: 100
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Original Product'); // Should remain unchanged
    expect(result!.sku).toEqual('ORIG-001'); // Should remain unchanged
    expect(result!.stock_level).toEqual(100);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update all fields', async () => {
    const product = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Completely Updated Product',
      sku: 'UPDATED-SKU-999',
      stock_level: 200
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Completely Updated Product');
    expect(result!.sku).toEqual('UPDATED-SKU-999');
    expect(result!.stock_level).toEqual(200);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > product.updated_at).toBe(true);
  });

  it('should update stock level to zero', async () => {
    const product = await createTestProduct({ stock_level: 50 });
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      stock_level: 0
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.stock_level).toEqual(0);
  });

  it('should save updated product to database', async () => {
    const product = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Database Updated Product',
      stock_level: 75
    };

    await updateProduct(updateInput);

    // Verify the update was persisted
    const savedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(savedProduct).toHaveLength(1);
    expect(savedProduct[0].name).toEqual('Database Updated Product');
    expect(savedProduct[0].stock_level).toEqual(75);
    expect(savedProduct[0].sku).toEqual('ORIG-001'); // Unchanged
    expect(savedProduct[0].updated_at > product.updated_at).toBe(true);
  });

  it('should return null for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'This should not work'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error for duplicate SKU', async () => {
    // Create two products
    const product1 = await createTestProduct({ sku: 'EXISTING-SKU' });
    const product2 = await createTestProduct({ sku: 'DIFFERENT-SKU' });
    
    const updateInput: UpdateProductInput = {
      id: product2.id,
      sku: 'EXISTING-SKU' // Try to use product1's SKU
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/SKU 'EXISTING-SKU' already exists/i);
  });

  it('should allow updating product with its own SKU', async () => {
    const product = await createTestProduct({ sku: 'SAME-SKU' });
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Name',
      sku: 'SAME-SKU' // Same SKU should be allowed
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.name).toEqual('Updated Name');
    expect(result!.sku).toEqual('SAME-SKU');
  });

  it('should preserve created_at timestamp', async () => {
    const product = await createTestProduct();
    const originalCreatedAt = product.created_at;
    
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeTruthy();
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at > originalCreatedAt).toBe(true);
  });
});
