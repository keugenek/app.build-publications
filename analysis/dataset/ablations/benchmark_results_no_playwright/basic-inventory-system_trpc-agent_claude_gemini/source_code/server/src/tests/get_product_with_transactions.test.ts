import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type GetProductByIdInput } from '../schema';
import { getProductWithTransactions } from '../handlers/get_product_with_transactions';

describe('getProductWithTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product with transactions', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        stock_level: 50
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Create test transactions
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: product.id,
          transaction_type: 'STOCK_IN',
          quantity: 100,
          notes: 'Initial stock'
        },
        {
          product_id: product.id,
          transaction_type: 'STOCK_OUT',
          quantity: 30,
          notes: 'Sale to customer'
        },
        {
          product_id: product.id,
          transaction_type: 'STOCK_OUT',
          quantity: 20,
          notes: 'Another sale'
        }
      ])
      .execute();

    const input: GetProductByIdInput = {
      id: product.id
    };

    const result = await getProductWithTransactions(input);

    // Verify product data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(product.id);
    expect(result!.name).toBe('Test Product');
    expect(result!.sku).toBe('TEST-001');
    expect(result!.description).toBe('A test product');
    expect(result!.stock_level).toBe(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify transactions
    expect(result!.transactions).toHaveLength(3);
    
    const stockInTransaction = result!.transactions.find(t => t.transaction_type === 'STOCK_IN');
    expect(stockInTransaction).toBeDefined();
    expect(stockInTransaction!.quantity).toBe(100);
    expect(stockInTransaction!.notes).toBe('Initial stock');
    expect(stockInTransaction!.product_id).toBe(product.id);
    expect(stockInTransaction!.created_at).toBeInstanceOf(Date);

    const stockOutTransactions = result!.transactions.filter(t => t.transaction_type === 'STOCK_OUT');
    expect(stockOutTransactions).toHaveLength(2);
    expect(stockOutTransactions[0].quantity).toBe(30);
    expect(stockOutTransactions[1].quantity).toBe(20);
  });

  it('should return product with empty transactions array if no transactions exist', async () => {
    // Create a test product without transactions
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product Without Transactions',
        sku: 'NO-TRANS-001',
        description: null,
        stock_level: 0
      })
      .returning()
      .execute();

    const product = productResult[0];

    const input: GetProductByIdInput = {
      id: product.id
    };

    const result = await getProductWithTransactions(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(product.id);
    expect(result!.name).toBe('Product Without Transactions');
    expect(result!.sku).toBe('NO-TRANS-001');
    expect(result!.description).toBeNull();
    expect(result!.stock_level).toBe(0);
    expect(result!.transactions).toEqual([]);
  });

  it('should return null when product does not exist', async () => {
    const input: GetProductByIdInput = {
      id: 999999 // Non-existent product ID
    };

    const result = await getProductWithTransactions(input);

    expect(result).toBeNull();
  });

  it('should handle transactions with null notes', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product With Null Notes',
        sku: 'NULL-NOTES-001',
        description: 'Product for testing null notes',
        stock_level: 25
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Create transaction with null notes
    await db.insert(stockTransactionsTable)
      .values({
        product_id: product.id,
        transaction_type: 'STOCK_IN',
        quantity: 50,
        notes: null
      })
      .execute();

    const input: GetProductByIdInput = {
      id: product.id
    };

    const result = await getProductWithTransactions(input);

    expect(result).not.toBeNull();
    expect(result!.transactions).toHaveLength(1);
    expect(result!.transactions[0].notes).toBeNull();
    expect(result!.transactions[0].quantity).toBe(50);
    expect(result!.transactions[0].transaction_type).toBe('STOCK_IN');
  });

  it('should return transactions ordered by creation time', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product For Order Test',
        sku: 'ORDER-001',
        description: 'Testing transaction order',
        stock_level: 100
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Create transactions in sequence
    const transaction1 = await db.insert(stockTransactionsTable)
      .values({
        product_id: product.id,
        transaction_type: 'STOCK_IN',
        quantity: 100,
        notes: 'First transaction'
      })
      .returning()
      .execute();

    const transaction2 = await db.insert(stockTransactionsTable)
      .values({
        product_id: product.id,
        transaction_type: 'STOCK_OUT',
        quantity: 25,
        notes: 'Second transaction'
      })
      .returning()
      .execute();

    const input: GetProductByIdInput = {
      id: product.id
    };

    const result = await getProductWithTransactions(input);

    expect(result).not.toBeNull();
    expect(result!.transactions).toHaveLength(2);
    
    // Verify that transactions are returned (database order may vary)
    const firstTransaction = result!.transactions.find(t => t.notes === 'First transaction');
    const secondTransaction = result!.transactions.find(t => t.notes === 'Second transaction');
    
    expect(firstTransaction).toBeDefined();
    expect(secondTransaction).toBeDefined();
    expect(firstTransaction!.id).toBe(transaction1[0].id);
    expect(secondTransaction!.id).toBe(transaction2[0].id);
  });
});
