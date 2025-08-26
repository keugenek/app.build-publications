import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type DeleteProductInput } from '../schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A product for testing deletion',
        stock_level: 50
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct({ id: productId });

    expect(result).toBe(true);

    // Verify product is deleted from database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent product', async () => {
    const nonExistentId = 99999;

    const result = await deleteProduct({ id: nonExistentId });

    expect(result).toBe(false);

    // Verify no products were affected
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(0);
  });

  it('should cascade delete associated stock transactions', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product with Transactions',
        sku: 'TEST-002',
        description: 'Product with stock transactions',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create some stock transactions for this product
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: productId,
          transaction_type: 'STOCK_IN',
          quantity: 50,
          notes: 'Initial stock'
        },
        {
          product_id: productId,
          transaction_type: 'STOCK_OUT',
          quantity: 10,
          notes: 'Sale'
        }
      ])
      .execute();

    // Verify transactions exist before deletion
    const transactionsBeforeDelete = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, productId))
      .execute();

    expect(transactionsBeforeDelete).toHaveLength(2);

    // Delete the product
    const result = await deleteProduct({ id: productId });

    expect(result).toBe(true);

    // Verify product is deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);

    // Verify associated transactions are also deleted (CASCADE)
    const transactionsAfterDelete = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, productId))
      .execute();

    expect(transactionsAfterDelete).toHaveLength(0);
  });

  it('should not affect other products when deleting one product', async () => {
    // Create two test products
    const productsResult = await db.insert(productsTable)
      .values([
        {
          name: 'Product to Delete',
          sku: 'DELETE-001',
          description: 'This will be deleted',
          stock_level: 25
        },
        {
          name: 'Product to Keep',
          sku: 'KEEP-001',
          description: 'This should remain',
          stock_level: 75
        }
      ])
      .returning()
      .execute();

    const productToDeleteId = productsResult[0].id;
    const productToKeepId = productsResult[1].id;

    // Delete the first product
    const result = await deleteProduct({ id: productToDeleteId });

    expect(result).toBe(true);

    // Verify the deleted product is gone
    const deletedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productToDeleteId))
      .execute();

    expect(deletedProduct).toHaveLength(0);

    // Verify the other product still exists
    const remainingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productToKeepId))
      .execute();

    expect(remainingProduct).toHaveLength(1);
    expect(remainingProduct[0].name).toEqual('Product to Keep');
    expect(remainingProduct[0].sku).toEqual('KEEP-001');
    expect(remainingProduct[0].stock_level).toEqual(75);
  });

  it('should handle deletion with minimal product data', async () => {
    // Create a minimal product (only required fields)
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Minimal Product',
        sku: 'MIN-001'
        // description is nullable and stock_level has default
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct({ id: productId });

    expect(result).toBe(true);

    // Verify product is deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);
  });
});
