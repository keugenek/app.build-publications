import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Helper function to create a test product
const createTestProduct = async (overrides = {}) => {
  const result = await db.insert(productsTable)
    .values({
      name: 'Test Product',
      sku: 'TEST-SKU-001',
      stockLevel: 10,
      ...overrides
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update product name', async () => {
    // Create a test product first
    const product = await createTestProduct();
    
    // Update the product name
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product Name'
    };
    
    const result = await updateProduct(updateInput);

    // Validation
    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.sku).toEqual(product.sku);
    expect(result.stockLevel).toEqual(product.stockLevel);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt).not.toEqual(product.updatedAt); // Should be updated
  });

  it('should update product SKU', async () => {
    // Create a test product first
    const product = await createTestProduct();
    
    // Update the product SKU
    const updateInput: UpdateProductInput = {
      id: product.id,
      sku: 'UPDATED-SKU-001'
    };
    
    const result = await updateProduct(updateInput);

    // Validation
    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual(product.name);
    expect(result.sku).toEqual('UPDATED-SKU-001');
    expect(result.stockLevel).toEqual(product.stockLevel);
  });

  it('should update product stock level', async () => {
    // Create a test product first
    const product = await createTestProduct();
    
    // Update the product stock level
    const updateInput: UpdateProductInput = {
      id: product.id,
      stockLevel: 99
    };
    
    const result = await updateProduct(updateInput);

    // Validation
    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual(product.name);
    expect(result.sku).toEqual(product.sku);
    expect(result.stockLevel).toEqual(99);
  });

  it('should update multiple fields at once', async () => {
    // Create a test product first
    const product = await createTestProduct();
    
    // Update multiple fields
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Completely Updated Product',
      sku: 'NEW-SKU-999',
      stockLevel: 50
    };
    
    const result = await updateProduct(updateInput);

    // Validation
    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Completely Updated Product');
    expect(result.sku).toEqual('NEW-SKU-999');
    expect(result.stockLevel).toEqual(50);
  });

  it('should save updated product to database', async () => {
    // Create a test product first
    const product = await createTestProduct();
    
    // Update the product
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Database Updated Product'
    };
    
    await updateProduct(updateInput);

    // Query the database to verify the update was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(products[0].sku).toEqual(product.sku);
    expect(products[0].stockLevel).toEqual(product.stockLevel);
    expect(products[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Product'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/Product with id 99999 not found/);
  });
});
