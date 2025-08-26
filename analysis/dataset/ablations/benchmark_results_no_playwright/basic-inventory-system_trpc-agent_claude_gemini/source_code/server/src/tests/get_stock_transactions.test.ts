import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { getStockTransactions } from '../handlers/get_stock_transactions';

describe('getStockTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getStockTransactions();

    expect(result).toEqual([]);
  });

  it('should return all stock transactions', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A product for testing',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test transactions
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
          notes: 'Sale order'
        },
        {
          product_id: productId,
          transaction_type: 'STOCK_IN',
          quantity: 25,
          notes: 'Restock'
        }
      ])
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(3);
    
    // Verify all transactions are returned
    const stockInTransactions = result.filter(t => t.transaction_type === 'STOCK_IN');
    const stockOutTransactions = result.filter(t => t.transaction_type === 'STOCK_OUT');
    
    expect(stockInTransactions).toHaveLength(2);
    expect(stockOutTransactions).toHaveLength(1);

    // Verify each transaction has required fields
    result.forEach(transaction => {
      expect(transaction.id).toBeDefined();
      expect(transaction.product_id).toEqual(productId);
      expect(['STOCK_IN', 'STOCK_OUT']).toContain(transaction.transaction_type);
      expect(transaction.quantity).toBeGreaterThan(0);
      expect(transaction.created_at).toBeInstanceOf(Date);
      expect(transaction.notes).toBeDefined(); // Can be null or string
    });
  });

  it('should return transactions ordered by creation date (most recent first)', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-002',
        description: 'A product for testing',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transactions with small delays to ensure different timestamps
    const firstTransaction = await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_IN',
        quantity: 30,
        notes: 'First transaction'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTransaction = await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_OUT',
        quantity: 5,
        notes: 'Second transaction'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTransaction = await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_IN',
        quantity: 15,
        notes: 'Third transaction'
      })
      .returning()
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
    
    // Verify the order matches our expectations (third, second, first)
    expect(result[0].notes).toEqual('Third transaction');
    expect(result[1].notes).toEqual('Second transaction');
    expect(result[2].notes).toEqual('First transaction');
  });

  it('should handle transactions with null notes', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-003',
        description: 'A product for testing',
        stock_level: 50
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transaction with null notes
    await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_IN',
        quantity: 20,
        notes: null
      })
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].quantity).toEqual(20);
    expect(result[0].transaction_type).toEqual('STOCK_IN');
  });

  it('should handle transactions from multiple products', async () => {
    // Create multiple test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        description: 'First product',
        stock_level: 100
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        description: 'Second product',
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
          transaction_type: 'STOCK_IN',
          quantity: 40,
          notes: 'Product 1 stock in'
        },
        {
          product_id: product2Id,
          transaction_type: 'STOCK_OUT',
          quantity: 15,
          notes: 'Product 2 stock out'
        },
        {
          product_id: product1Id,
          transaction_type: 'STOCK_OUT',
          quantity: 8,
          notes: 'Product 1 stock out'
        }
      ])
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(3);
    
    // Verify transactions from both products are included
    const product1Transactions = result.filter(t => t.product_id === product1Id);
    const product2Transactions = result.filter(t => t.product_id === product2Id);
    
    expect(product1Transactions).toHaveLength(2);
    expect(product2Transactions).toHaveLength(1);
    
    // Verify specific transaction details
    const product2Transaction = product2Transactions[0];
    expect(product2Transaction.transaction_type).toEqual('STOCK_OUT');
    expect(product2Transaction.quantity).toEqual(15);
    expect(product2Transaction.notes).toEqual('Product 2 stock out');
  });
});
