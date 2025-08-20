import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateProductInput, type CreateTransactionInput } from '../schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

// Test data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-SKU-001',
  stock_level: 100
};

const createTestProduct = async (): Promise<number> => {
  const result = await db.insert(productsTable)
    .values({
      name: testProduct.name,
      sku: testProduct.sku,
      stock_level: testProduct.stock_level
    })
    .returning()
    .execute();
  
  return result[0].id;
};

const createTestTransaction = async (productId: number): Promise<void> => {
  const transactionInput: CreateTransactionInput = {
    product_id: productId,
    type: 'stock_in',
    quantity: 50,
    notes: 'Test transaction'
  };

  await db.insert(transactionsTable)
    .values({
      product_id: transactionInput.product_id,
      type: transactionInput.type,
      quantity: transactionInput.quantity,
      notes: transactionInput.notes
    })
    .execute();
};

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product and return true', async () => {
    // Create a test product
    const productId = await createTestProduct();

    // Verify product exists before deletion
    const productsBefore = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(productsBefore).toHaveLength(1);

    // Delete the product
    const result = await deleteProduct(productId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify product no longer exists in database
    const productsAfter = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(productsAfter).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent product', async () => {
    // Try to delete a product that doesn't exist
    const nonExistentId = 999;
    const result = await deleteProduct(nonExistentId);

    // Should return false indicating no product was deleted
    expect(result).toBe(false);
  });

  it('should cascade delete related transactions when product is deleted', async () => {
    // Create a test product
    const productId = await createTestProduct();

    // Create some related transactions
    await createTestTransaction(productId);
    await createTestTransaction(productId);

    // Verify transactions exist before deletion
    const transactionsBefore = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, productId))
      .execute();

    expect(transactionsBefore).toHaveLength(2);

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is deleted
    const productsAfter = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(productsAfter).toHaveLength(0);

    // Verify related transactions are cascade deleted
    const transactionsAfter = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, productId))
      .execute();

    expect(transactionsAfter).toHaveLength(0);
  });

  it('should not affect other products when deleting one product', async () => {
    // Create multiple test products
    const productId1 = await createTestProduct();
    
    const product2 = await db.insert(productsTable)
      .values({
        name: 'Another Product',
        sku: 'TEST-SKU-002',
        stock_level: 50
      })
      .returning()
      .execute();
    const productId2 = product2[0].id;

    // Create transactions for both products
    await createTestTransaction(productId1);
    await createTestTransaction(productId2);

    // Delete only the first product
    const result = await deleteProduct(productId1);

    expect(result).toBe(true);

    // Verify first product and its transaction are deleted
    const product1After = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId1))
      .execute();

    const transactions1After = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, productId1))
      .execute();

    expect(product1After).toHaveLength(0);
    expect(transactions1After).toHaveLength(0);

    // Verify second product and its transaction still exist
    const product2After = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId2))
      .execute();

    const transactions2After = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, productId2))
      .execute();

    expect(product2After).toHaveLength(1);
    expect(product2After[0].name).toEqual('Another Product');
    expect(transactions2After).toHaveLength(1);
  });

  it('should handle deletion of product with no transactions', async () => {
    // Create a product without any transactions
    const productId = await createTestProduct();

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is deleted
    const productsAfter = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(productsAfter).toHaveLength(0);
  });
});
