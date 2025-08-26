import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type GetTransactionsByProductInput } from '../schema';
import { getTransactionsByProduct } from '../handlers/get_transactions_by_product';

describe('getTransactionsByProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when product has no transactions', async () => {
    // Create a product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        stock_level: 0
      })
      .returning()
      .execute();

    const testInput: GetTransactionsByProductInput = {
      product_id: productResult[0].id
    };

    const result = await getTransactionsByProduct(testInput);

    expect(result).toEqual([]);
  });

  it('should return transactions for a specific product', async () => {
    // Create a product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create multiple transactions for this product
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
          quantity: 20,
          notes: 'Sale transaction'
        },
        {
          product_id: productId,
          transaction_type: 'STOCK_IN',
          quantity: 70,
          notes: 'Restock'
        }
      ])
      .execute();

    const testInput: GetTransactionsByProductInput = {
      product_id: productId
    };

    const result = await getTransactionsByProduct(testInput);

    expect(result).toHaveLength(3);
    
    // Verify all transactions belong to the correct product
    result.forEach(transaction => {
      expect(transaction.product_id).toEqual(productId);
      expect(transaction.id).toBeDefined();
      expect(transaction.created_at).toBeInstanceOf(Date);
      expect(['STOCK_IN', 'STOCK_OUT']).toContain(transaction.transaction_type);
      expect(transaction.quantity).toBeGreaterThan(0);
    });

    // Verify transactions are ordered by creation date (most recent first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }

    // Verify we have all expected transaction types and quantities
    const notes = result.map(t => t.notes);
    const types = result.map(t => t.transaction_type);
    const quantities = result.map(t => t.quantity);

    expect(notes).toContain('Initial stock');
    expect(notes).toContain('Sale transaction');
    expect(notes).toContain('Restock');
    expect(types).toContain('STOCK_IN');
    expect(types).toContain('STOCK_OUT');
    expect(quantities).toContain(50);
    expect(quantities).toContain(20);
    expect(quantities).toContain(70);
  });

  it('should return transactions ordered by creation date (most recent first)', async () => {
    // Create a product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        stock_level: 50
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transactions with a slight delay to ensure different timestamps
    const transaction1 = await db.insert(stockTransactionsTable)
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

    const transaction2 = await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_OUT',
        quantity: 10,
        notes: 'Second transaction'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const transaction3 = await db.insert(stockTransactionsTable)
      .values({
        product_id: productId,
        transaction_type: 'STOCK_IN',
        quantity: 25,
        notes: 'Third transaction'
      })
      .returning()
      .execute();

    const testInput: GetTransactionsByProductInput = {
      product_id: productId
    };

    const result = await getTransactionsByProduct(testInput);

    expect(result).toHaveLength(3);
    
    // Verify order by creation date (most recent first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
    
    // Verify the actual order based on notes
    expect(result[0].notes).toEqual('Third transaction');
    expect(result[1].notes).toEqual('Second transaction');
    expect(result[2].notes).toEqual('First transaction');
  });

  it('should only return transactions for the specified product', async () => {
    // Create two products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        description: 'First product',
        stock_level: 50
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        description: 'Second product',
        stock_level: 30
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
          quantity: 25,
          notes: 'Product 1 transaction 1'
        },
        {
          product_id: product1Id,
          transaction_type: 'STOCK_OUT',
          quantity: 5,
          notes: 'Product 1 transaction 2'
        },
        {
          product_id: product2Id,
          transaction_type: 'STOCK_IN',
          quantity: 15,
          notes: 'Product 2 transaction 1'
        },
        {
          product_id: product2Id,
          transaction_type: 'STOCK_OUT',
          quantity: 8,
          notes: 'Product 2 transaction 2'
        }
      ])
      .execute();

    // Test getting transactions for product 1 only
    const testInput1: GetTransactionsByProductInput = {
      product_id: product1Id
    };

    const result1 = await getTransactionsByProduct(testInput1);

    expect(result1).toHaveLength(2);
    result1.forEach(transaction => {
      expect(transaction.product_id).toEqual(product1Id);
      expect(transaction.notes?.startsWith('Product 1')).toBe(true);
    });

    // Test getting transactions for product 2 only
    const testInput2: GetTransactionsByProductInput = {
      product_id: product2Id
    };

    const result2 = await getTransactionsByProduct(testInput2);

    expect(result2).toHaveLength(2);
    result2.forEach(transaction => {
      expect(transaction.product_id).toEqual(product2Id);
      expect(transaction.notes?.startsWith('Product 2')).toBe(true);
    });
  });

  it('should handle transactions with null notes', async () => {
    // Create a product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        stock_level: 20
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transactions with and without notes
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: productId,
          transaction_type: 'STOCK_IN',
          quantity: 15,
          notes: 'Transaction with notes'
        },
        {
          product_id: productId,
          transaction_type: 'STOCK_OUT',
          quantity: 5,
          notes: null // Explicitly null notes
        }
      ])
      .execute();

    const testInput: GetTransactionsByProductInput = {
      product_id: productId
    };

    const result = await getTransactionsByProduct(testInput);

    expect(result).toHaveLength(2);
    
    // Find the transaction with null notes
    const transactionWithNullNotes = result.find(t => t.notes === null);
    expect(transactionWithNullNotes).toBeDefined();
    expect(transactionWithNullNotes?.transaction_type).toEqual('STOCK_OUT');
    expect(transactionWithNullNotes?.quantity).toEqual(5);

    // Find the transaction with notes
    const transactionWithNotes = result.find(t => t.notes !== null);
    expect(transactionWithNotes).toBeDefined();
    expect(transactionWithNotes?.notes).toEqual('Transaction with notes');
    expect(transactionWithNotes?.transaction_type).toEqual('STOCK_IN');
    expect(transactionWithNotes?.quantity).toEqual(15);
  });
});
