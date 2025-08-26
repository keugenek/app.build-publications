import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product', async () => {
    // First create a product directly in the database
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST123',
        stock_quantity: 50
      })
      .returning()
      .execute();
    
    const createdProduct = result[0];
    const productId = createdProduct.id;
    
    // Then delete it using our handler
    const deletedProduct = await deleteProduct(productId);
    
    // Check that the returned product has correct data
    expect(deletedProduct.id).toBe(productId);
    expect(deletedProduct.name).toBe('Test Product');
    expect(deletedProduct.sku).toBe('TEST123');
    expect(deletedProduct.stock_quantity).toBe(50);
    expect(deletedProduct.created_at).toBeInstanceOf(Date);
    expect(deletedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should remove product from database', async () => {
    // First create a product directly in the database
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST456',
        stock_quantity: 100
      })
      .returning()
      .execute();
    
    const productId = result[0].id;
    
    // Verify product exists in database
    let products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();
    
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Test Product');
    
    // Delete the product using our handler
    await deleteProduct(productId);
    
    // Verify product no longer exists in database
    products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();
    
    expect(products).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent product', async () => {
    // Try to delete a product that doesn't exist
    await expect(deleteProduct(99999))
      .rejects
      .toThrow(/Product with id 99999 not found/);
  });
});
