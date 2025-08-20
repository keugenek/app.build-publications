import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Create a test product first
const testProduct = {
  name: 'Test Product',
  stock_quantity: 100
};

const updateInput: UpdateProductInput = {
  id: 1,
  name: 'Updated Product Name',
  stock_quantity: 50
};

describe('updateProduct', () => {
  beforeEach(async () => {
    await createDB();
    // Create a product to update
    await db.insert(productsTable).values(testProduct).execute();
  });
  
  afterEach(resetDB);

  it('should update a product name', async () => {
    const result = await updateProduct({
      id: 1,
      name: 'Updated Product Name'
    });

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.stock_quantity).toEqual(100); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update a product stock quantity', async () => {
    const result = await updateProduct({
      id: 1,
      stock_quantity: 50
    });

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Test Product'); // Should remain unchanged
    expect(result.stock_quantity).toEqual(50);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both name and stock quantity', async () => {
    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.stock_quantity).toEqual(50);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated product to database', async () => {
    await updateProduct(updateInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Updated Product Name');
    expect(products[0].stock_quantity).toEqual(50);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const invalidInput: UpdateProductInput = {
      id: 999,
      name: 'Non-existent Product'
    };

    await expect(updateProduct(invalidInput)).rejects.toThrow(/not found/);
  });
});