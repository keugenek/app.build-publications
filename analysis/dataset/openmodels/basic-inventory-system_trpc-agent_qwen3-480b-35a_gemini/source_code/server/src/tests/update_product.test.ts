import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Test data for updating a product
const updateInput: UpdateProductInput = {
  id: 1,
  name: 'Updated Product Name',
  sku: 'TEST-002',
  stock_quantity: 100
};

describe('updateProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a product to update directly in the database
    await db.insert(productsTable)
      .values({
        id: 1,
        name: 'Test Product',
        sku: 'TEST-001',
        stock_quantity: 50
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a product with all fields provided', async () => {
    const result = await updateProduct(updateInput);

    // Validate the returned product
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(1);
    expect(result!.name).toEqual('Updated Product Name');
    expect(result!.sku).toEqual('TEST-002');
    expect(result!.stock_quantity).toEqual(100);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    
    // Ensure updated_at is different from created_at (after a small delay)
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(result!.created_at.getTime());
  });

  it('should update only provided fields', async () => {
    // First get the original product
    const originalProducts = await db.select().from(productsTable).where(eq(productsTable.id, 1)).execute();
    const originalProduct = originalProducts[0];
    
    // Update only the name
    const partialUpdateInput: UpdateProductInput = {
      id: 1,
      name: 'Partially Updated Product'
    };
    
    const result = await updateProduct(partialUpdateInput);

    // Validate that only the name was updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(1);
    expect(result!.name).toEqual('Partially Updated Product');
    expect(result!.sku).toEqual(originalProduct.sku); // Should remain unchanged
    expect(result!.stock_quantity).toEqual(originalProduct.stock_quantity); // Should remain unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalProduct.updated_at.getTime());
  });

  it('should return null when trying to update a non-existent product', async () => {
    const nonExistentUpdateInput: UpdateProductInput = {
      id: 999,
      name: 'Non-existent Product'
    };
    
    const result = await updateProduct(nonExistentUpdateInput);
    
    expect(result).toBeNull();
  });

  it('should save updated product to database', async () => {
    await updateProduct(updateInput);

    // Query the database to verify the update was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Updated Product Name');
    expect(products[0].sku).toEqual('TEST-002');
    expect(products[0].stock_quantity).toEqual(100);
    expect(products[0].updated_at.getTime()).toBeGreaterThanOrEqual(products[0].created_at.getTime());
  });
});
