import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product and return it', async () => {
    // First create a product directly in the database
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        stock_quantity: 100
      })
      .returning()
      .execute();
    
    const createdProduct = result[0];
    
    // Delete the product
    const deletedProduct = await deleteProduct(createdProduct.id);
    
    // Verify the returned product
    expect(deletedProduct.id).toEqual(createdProduct.id);
    expect(deletedProduct.name).toEqual(createdProduct.name);
    expect(deletedProduct.stock_quantity).toEqual(createdProduct.stock_quantity);
    expect(deletedProduct.created_at).toBeInstanceOf(Date);
    expect(deletedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should actually remove the product from database', async () => {
    // First create a product directly in the database
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        stock_quantity: 100
      })
      .returning()
      .execute();
    
    const createdProduct = result[0];
    
    // Delete the product
    await deleteProduct(createdProduct.id);
    
    // Verify the product is removed from database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should throw an error when trying to delete non-existent product', async () => {
    // Try to delete a product that doesn't exist
    await expect(deleteProduct(99999))
      .rejects
      .toThrow(/Product with id 99999 not found/);
  });
});