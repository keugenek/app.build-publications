import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteProduct } from '../handlers/delete_product';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product', async () => {
    // Create a test product directly in the database
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST123',
        stockLevel: 10
      })
      .returning()
      .execute();

    // Delete the product
    const result = await deleteProduct(product.id);

    // Check that deletion was successful
    expect(result).toBe(true);

    // Verify product no longer exists in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent product', async () => {
    // Try to delete a product that doesn't exist
    const result = await deleteProduct(99999);

    // Check that deletion returned false
    expect(result).toBe(false);
  });

  it('should only delete the specified product', async () => {
    // Create multiple products
    const [product1] = await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        sku: 'TEST001',
        stockLevel: 5
      })
      .returning()
      .execute();

    const [product2] = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        sku: 'TEST002',
        stockLevel: 10
      })
      .returning()
      .execute();

    // Delete only the first product
    const result = await deleteProduct(product1.id);
    expect(result).toBe(true);

    // Verify first product no longer exists
    const products1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1.id))
      .execute();
    expect(products1).toHaveLength(0);

    // Verify second product still exists
    const products2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product2.id))
      .execute();
    expect(products2).toHaveLength(1);
    expect(products2[0].name).toEqual('Test Product 2');
  });
});
