import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { getProductTransactions } from '../handlers/get_product_transactions';

describe('getProductTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return transactions for a specific product ordered by created_at DESC', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-SKU-001',
        stock_level: 50
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create multiple transactions with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Insert transactions in non-chronological order
    await db.insert(transactionsTable)
      .values([
        {
          product_id: productId,
          type: 'stock_in',
          quantity: 10,
          notes: 'Second transaction',
          created_at: oneHourAgo
        },
        {
          product_id: productId,
          type: 'stock_out',
          quantity: 5,
          notes: 'Most recent transaction',
          created_at: now
        },
        {
          product_id: productId,
          type: 'stock_in',
          quantity: 20,
          notes: 'Oldest transaction',
          created_at: twoHoursAgo
        }
      ])
      .execute();

    const result = await getProductTransactions(productId);

    expect(result).toHaveLength(3);

    // Verify transactions are ordered by created_at DESC (most recent first)
    expect(result[0].notes).toEqual('Most recent transaction');
    expect(result[1].notes).toEqual('Second transaction');
    expect(result[2].notes).toEqual('Oldest transaction');

    // Verify all transactions belong to the correct product
    result.forEach(transaction => {
      expect(transaction.product_id).toEqual(productId);
    });

    // Verify transaction properties
    expect(result[0].type).toEqual('stock_out');
    expect(result[0].quantity).toEqual(5);
    expect(result[1].type).toEqual('stock_in');
    expect(result[1].quantity).toEqual(10);
    expect(result[2].type).toEqual('stock_in');
    expect(result[2].quantity).toEqual(20);
  });

  it('should return empty array for product with no transactions', async () => {
    // Create test product without transactions
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product Without Transactions',
        sku: 'NO-TRANS-001',
        stock_level: 0
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const result = await getProductTransactions(productId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return transactions for the specified product', async () => {
    // Create two products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 10
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        stock_level: 20
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create transactions for both products
    await db.insert(transactionsTable)
      .values([
        {
          product_id: product1Id,
          type: 'stock_in',
          quantity: 15,
          notes: 'Product 1 transaction 1'
        },
        {
          product_id: product1Id,
          type: 'stock_out',
          quantity: 5,
          notes: 'Product 1 transaction 2'
        },
        {
          product_id: product2Id,
          type: 'stock_in',
          quantity: 30,
          notes: 'Product 2 transaction'
        }
      ])
      .execute();

    const product1Transactions = await getProductTransactions(product1Id);
    const product2Transactions = await getProductTransactions(product2Id);

    // Verify product 1 has 2 transactions
    expect(product1Transactions).toHaveLength(2);
    product1Transactions.forEach(transaction => {
      expect(transaction.product_id).toEqual(product1Id);
      expect(transaction.notes).toMatch(/Product 1/);
    });

    // Verify product 2 has 1 transaction
    expect(product2Transactions).toHaveLength(1);
    expect(product2Transactions[0].product_id).toEqual(product2Id);
    expect(product2Transactions[0].notes).toEqual('Product 2 transaction');
  });

  it('should handle transactions with null notes', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'NULL-NOTES-001',
        stock_level: 10
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transaction with null notes
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_in',
        quantity: 25,
        notes: null
      })
      .execute();

    const result = await getProductTransactions(productId);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].quantity).toEqual(25);
    expect(result[0].type).toEqual('stock_in');
  });

  it('should return empty array for non-existent product', async () => {
    const nonExistentProductId = 99999;
    const result = await getProductTransactions(nonExistentProductId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
