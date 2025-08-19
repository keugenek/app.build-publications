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

  it('should fetch all stock transactions with product information', async () => {
    // Create test products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Product A',
          sku: 'SKU-A',
          stock_level: 100
        },
        {
          name: 'Product B', 
          sku: 'SKU-B',
          stock_level: 50
        }
      ])
      .returning()
      .execute();

    // Create test stock transactions
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: products[0].id,
          transaction_type: 'stock_in',
          quantity: 50,
          notes: 'Initial stock'
        },
        {
          product_id: products[1].id,
          transaction_type: 'stock_out',
          quantity: 10,
          notes: 'Sale transaction'
        },
        {
          product_id: products[0].id,
          transaction_type: 'stock_out',
          quantity: 25,
          notes: null
        }
      ])
      .execute();

    const result = await getStockTransactions();

    // Should return all 3 transactions
    expect(result).toHaveLength(3);

    // Verify transaction structure and data
    const stockInTransaction = result.find(t => t.transaction_type === 'stock_in');
    expect(stockInTransaction).toBeDefined();
    expect(stockInTransaction!.product_id).toEqual(products[0].id);
    expect(stockInTransaction!.quantity).toEqual(50);
    expect(stockInTransaction!.notes).toEqual('Initial stock');
    expect(stockInTransaction!.created_at).toBeInstanceOf(Date);
    expect(stockInTransaction!.id).toBeDefined();

    const stockOutTransactions = result.filter(t => t.transaction_type === 'stock_out');
    expect(stockOutTransactions).toHaveLength(2);

    // Verify transaction with null notes
    const nullNotesTransaction = result.find(t => t.notes === null);
    expect(nullNotesTransaction).toBeDefined();
    expect(nullNotesTransaction!.quantity).toEqual(25);
    expect(nullNotesTransaction!.transaction_type).toEqual('stock_out');
  });

  it('should handle multiple transactions for same product', async () => {
    // Create a single test product
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-SKU',
        stock_level: 0
      })
      .returning()
      .execute();

    // Create multiple transactions for the same product
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: product[0].id,
          transaction_type: 'stock_in',
          quantity: 100,
          notes: 'First delivery'
        },
        {
          product_id: product[0].id,
          transaction_type: 'stock_in',
          quantity: 50,
          notes: 'Second delivery'
        },
        {
          product_id: product[0].id,
          transaction_type: 'stock_out',
          quantity: 30,
          notes: 'First sale'
        }
      ])
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(3);
    
    // All transactions should be for the same product
    result.forEach(transaction => {
      expect(transaction.product_id).toEqual(product[0].id);
      expect(transaction.created_at).toBeInstanceOf(Date);
    });

    // Verify transaction types
    const stockInTransactions = result.filter(t => t.transaction_type === 'stock_in');
    const stockOutTransactions = result.filter(t => t.transaction_type === 'stock_out');
    
    expect(stockInTransactions).toHaveLength(2);
    expect(stockOutTransactions).toHaveLength(1);
  });

  it('should order transactions correctly (most recent first implied by database)', async () => {
    // Create test product
    const product = await db.insert(productsTable)
      .values({
        name: 'Ordering Test Product',
        sku: 'ORDER-TEST',
        stock_level: 0
      })
      .returning()
      .execute();

    // Create transactions with small delay to ensure different timestamps
    await db.insert(stockTransactionsTable)
      .values({
        product_id: product[0].id,
        transaction_type: 'stock_in',
        quantity: 100,
        notes: 'First transaction'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockTransactionsTable)
      .values({
        product_id: product[0].id,
        transaction_type: 'stock_out',
        quantity: 25,
        notes: 'Second transaction'
      })
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(2);
    
    // Verify both transactions are returned with valid timestamps
    result.forEach(transaction => {
      expect(transaction.created_at).toBeInstanceOf(Date);
      expect(transaction.product_id).toEqual(product[0].id);
    });

    const firstTransaction = result.find(t => t.notes === 'First transaction');
    const secondTransaction = result.find(t => t.notes === 'Second transaction');
    
    expect(firstTransaction).toBeDefined();
    expect(secondTransaction).toBeDefined();
    expect(firstTransaction!.quantity).toEqual(100);
    expect(secondTransaction!.quantity).toEqual(25);
  });

  it('should handle transactions with various note formats', async () => {
    // Create test product
    const product = await db.insert(productsTable)
      .values({
        name: 'Notes Test Product',
        sku: 'NOTES-TEST',
        stock_level: 0
      })
      .returning()
      .execute();

    // Create transactions with different note types
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: product[0].id,
          transaction_type: 'stock_in',
          quantity: 10,
          notes: 'Regular note'
        },
        {
          product_id: product[0].id,
          transaction_type: 'stock_in',
          quantity: 20,
          notes: ''  // Empty string
        },
        {
          product_id: product[0].id,
          transaction_type: 'stock_out',
          quantity: 5,
          notes: null  // Null value
        }
      ])
      .execute();

    const result = await getStockTransactions();

    expect(result).toHaveLength(3);
    
    const regularNote = result.find(t => t.notes === 'Regular note');
    const emptyNote = result.find(t => t.notes === '');
    const nullNote = result.find(t => t.notes === null);
    
    expect(regularNote).toBeDefined();
    expect(emptyNote).toBeDefined();
    expect(nullNote).toBeDefined();
    
    expect(regularNote!.quantity).toEqual(10);
    expect(emptyNote!.quantity).toEqual(20);
    expect(nullNote!.quantity).toEqual(5);
  });
});
