import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type DeleteProductInput, type CreateProductInput, type CreateStockTransactionInput } from '../schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product successfully', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 50
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const deleteInput: DeleteProductInput = { id: productId };
    await deleteProduct(deleteInput);

    // Verify product is deleted
    const deletedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(deletedProduct).toHaveLength(0);
  });

  it('should throw error when product not found', async () => {
    const deleteInput: DeleteProductInput = { id: 999 };
    
    await expect(deleteProduct(deleteInput)).rejects.toThrow(/Product with id 999 not found/i);
  });

  it('should cascade delete related stock transactions', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-002',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create stock transactions for the product
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: productId,
          transaction_type: 'stock_in',
          quantity: 50,
          notes: 'Initial stock'
        },
        {
          product_id: productId,
          transaction_type: 'stock_out',
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
    const deleteInput: DeleteProductInput = { id: productId };
    await deleteProduct(deleteInput);

    // Verify product is deleted
    const deletedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(deletedProduct).toHaveLength(0);

    // Verify all related stock transactions are also deleted
    const transactionsAfterDelete = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, productId))
      .execute();

    expect(transactionsAfterDelete).toHaveLength(0);
  });

  it('should not affect other products and their transactions', async () => {
    // Create two test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'TEST-003',
        stock_level: 25
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'TEST-004',
        stock_level: 75
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create transactions for both products
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: product1Id,
          transaction_type: 'stock_in',
          quantity: 25,
          notes: 'Product 1 transaction'
        },
        {
          product_id: product2Id,
          transaction_type: 'stock_in',
          quantity: 75,
          notes: 'Product 2 transaction'
        }
      ])
      .execute();

    // Delete only product 1
    const deleteInput: DeleteProductInput = { id: product1Id };
    await deleteProduct(deleteInput);

    // Verify product 1 is deleted
    const deletedProduct1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1Id))
      .execute();

    expect(deletedProduct1).toHaveLength(0);

    // Verify product 2 still exists
    const remainingProduct2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product2Id))
      .execute();

    expect(remainingProduct2).toHaveLength(1);
    expect(remainingProduct2[0].name).toEqual('Product 2');

    // Verify product 1 transactions are deleted
    const product1Transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, product1Id))
      .execute();

    expect(product1Transactions).toHaveLength(0);

    // Verify product 2 transactions still exist
    const product2Transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, product2Id))
      .execute();

    expect(product2Transactions).toHaveLength(1);
    expect(product2Transactions[0].notes).toEqual('Product 2 transaction');
  });

  it('should handle product with no transactions', async () => {
    // Create test product without any transactions
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product Without Transactions',
        sku: 'TEST-005',
        stock_level: 0
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const deleteInput: DeleteProductInput = { id: productId };
    await deleteProduct(deleteInput);

    // Verify product is deleted
    const deletedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(deletedProduct).toHaveLength(0);
  });
});
