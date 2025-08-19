import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type GetTransactionsByProductInput } from '../schema';
import { getTransactionsByProduct } from '../handlers/get_transactions_by_product';

describe('getTransactionsByProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist for product', async () => {
    // Create a product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 0
      })
      .returning()
      .execute();

    const input: GetTransactionsByProductInput = {
      product_id: productResult[0].id
    };

    const result = await getTransactionsByProduct(input);

    expect(result).toHaveLength(0);
  });

  it('should return transactions for a specific product', async () => {
    // Create two products
    const product1 = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 10
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Product 2', 
        sku: 'PROD-002',
        stock_level: 5
      })
      .returning()
      .execute();

    // Create transactions for both products with delays to ensure ordering
    await db.insert(stockTransactionsTable)
      .values({
        product_id: product1[0].id,
        transaction_type: 'stock_in',
        quantity: 10,
        notes: 'Initial stock'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockTransactionsTable)
      .values({
        product_id: product1[0].id,
        transaction_type: 'stock_out',
        quantity: 2,
        notes: 'Sale'
      })
      .execute();

    await db.insert(stockTransactionsTable)
      .values({
        product_id: product2[0].id,
        transaction_type: 'stock_in',
        quantity: 5,
        notes: 'Different product stock'
      })
      .execute();

    const input: GetTransactionsByProductInput = {
      product_id: product1[0].id
    };

    const result = await getTransactionsByProduct(input);

    // Should only return transactions for product 1
    expect(result).toHaveLength(2);
    
    // Verify all returned transactions belong to the correct product
    result.forEach(transaction => {
      expect(transaction.product_id).toEqual(product1[0].id);
    });

    // Verify the specific transaction data (newest first due to ordering)
    expect(result[0].transaction_type).toEqual('stock_out');
    expect(result[0].quantity).toEqual(2);
    expect(result[0].notes).toEqual('Sale');
    
    expect(result[1].transaction_type).toEqual('stock_in');
    expect(result[1].quantity).toEqual(10);
    expect(result[1].notes).toEqual('Initial stock');
  });

  it('should return transactions ordered by creation date (newest first)', async () => {
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-ORDER',
        stock_level: 15
      })
      .returning()
      .execute();

    // Create transactions with slight delays to ensure different timestamps
    const transaction1 = await db.insert(stockTransactionsTable)
      .values({
        product_id: productResult[0].id,
        transaction_type: 'stock_in',
        quantity: 10,
        notes: 'First transaction'
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const transaction2 = await db.insert(stockTransactionsTable)
      .values({
        product_id: productResult[0].id,
        transaction_type: 'stock_out',
        quantity: 3,
        notes: 'Second transaction'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const transaction3 = await db.insert(stockTransactionsTable)
      .values({
        product_id: productResult[0].id,
        transaction_type: 'stock_in',
        quantity: 5,
        notes: 'Third transaction'
      })
      .returning()
      .execute();

    const input: GetTransactionsByProductInput = {
      product_id: productResult[0].id
    };

    const result = await getTransactionsByProduct(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first (descending by created_at)
    expect(result[0].notes).toEqual('Third transaction');
    expect(result[1].notes).toEqual('Second transaction');
    expect(result[2].notes).toEqual('First transaction');

    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should handle transactions with null notes', async () => {
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-NULL',
        stock_level: 10
      })
      .returning()
      .execute();

    // Create transaction with null notes
    await db.insert(stockTransactionsTable)
      .values({
        product_id: productResult[0].id,
        transaction_type: 'stock_in',
        quantity: 10,
        notes: null
      })
      .execute();

    const input: GetTransactionsByProductInput = {
      product_id: productResult[0].id
    };

    const result = await getTransactionsByProduct(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].quantity).toEqual(10);
    expect(result[0].transaction_type).toEqual('stock_in');
  });

  it('should return all transaction types correctly', async () => {
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-TYPES',
        stock_level: 8
      })
      .returning()
      .execute();

    // Create one transaction of each type
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: productResult[0].id,
          transaction_type: 'stock_in',
          quantity: 10,
          notes: 'Stock in transaction'
        },
        {
          product_id: productResult[0].id,
          transaction_type: 'stock_out',
          quantity: 2,
          notes: 'Stock out transaction'
        }
      ])
      .execute();

    const input: GetTransactionsByProductInput = {
      product_id: productResult[0].id
    };

    const result = await getTransactionsByProduct(input);

    expect(result).toHaveLength(2);
    
    // Find each transaction type
    const stockInTransaction = result.find(t => t.transaction_type === 'stock_in');
    const stockOutTransaction = result.find(t => t.transaction_type === 'stock_out');

    expect(stockInTransaction).toBeDefined();
    expect(stockInTransaction!.quantity).toEqual(10);
    expect(stockInTransaction!.notes).toEqual('Stock in transaction');

    expect(stockOutTransaction).toBeDefined();
    expect(stockOutTransaction!.quantity).toEqual(2);
    expect(stockOutTransaction!.notes).toEqual('Stock out transaction');
  });
});
