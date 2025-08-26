import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type GetTransactionsInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    
    expect(result).toEqual([]);
  });

  it('should return all transactions with default pagination', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test transactions individually to ensure proper ordering
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_in',
        quantity: 50,
        notes: 'Initial stock'
      })
      .execute();

    // Add small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 2));

    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_out',
        quantity: 10,
        notes: 'Sale'
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('stock_out'); // Most recent first
    expect(result[1].type).toEqual('stock_in');
    expect(result[0].quantity).toEqual(10);
    expect(result[1].quantity).toEqual(50);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    // Verify ordering
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should filter transactions by product_id', async () => {
    // Create two test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        stock_level: 50
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create transactions for both products individually with delays
    await db.insert(transactionsTable)
      .values({
        product_id: product1Id,
        type: 'stock_in',
        quantity: 25,
        notes: 'Product 1 stock'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 2));

    await db.insert(transactionsTable)
      .values({
        product_id: product2Id,
        type: 'stock_in',
        quantity: 15,
        notes: 'Product 2 stock'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 2));

    await db.insert(transactionsTable)
      .values({
        product_id: product1Id,
        type: 'stock_out',
        quantity: 5,
        notes: 'Product 1 sale'
      })
      .execute();

    const input: GetTransactionsInput = {
      product_id: product1Id
    };

    const result = await getTransactions(input);

    expect(result).toHaveLength(2);
    expect(result.every(t => t.product_id === product1Id)).toBe(true);
    expect(result[0].type).toEqual('stock_out'); // Most recent first
    expect(result[1].type).toEqual('stock_in');
  });

  it('should filter transactions by type', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transactions of different types individually
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_in',
        quantity: 25,
        notes: 'Restock'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 2));

    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_out',
        quantity: 10,
        notes: 'Sale 1'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 2));

    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_out',
        quantity: 5,
        notes: 'Sale 2'
      })
      .execute();

    const input: GetTransactionsInput = {
      type: 'stock_out'
    };

    const result = await getTransactions(input);

    expect(result).toHaveLength(2);
    expect(result.every(t => t.type === 'stock_out')).toBe(true);
    expect(result[0].quantity).toEqual(5); // Most recent first
    expect(result[1].quantity).toEqual(10);
  });

  it('should filter by both product_id and type', async () => {
    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        stock_level: 50
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create various transactions
    await db.insert(transactionsTable)
      .values({
        product_id: product1Id,
        type: 'stock_in',
        quantity: 25,
        notes: 'Product 1 restock'
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        product_id: product1Id,
        type: 'stock_out',
        quantity: 10,
        notes: 'Product 1 sale'
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        product_id: product2Id,
        type: 'stock_out',
        quantity: 5,
        notes: 'Product 2 sale'
      })
      .execute();

    const input: GetTransactionsInput = {
      product_id: product1Id,
      type: 'stock_out'
    };

    const result = await getTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(product1Id);
    expect(result[0].type).toEqual('stock_out');
    expect(result[0].quantity).toEqual(10);
  });

  it('should respect pagination limits', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transactions individually to ensure proper ordering
    for (let i = 1; i <= 10; i++) {
      await db.insert(transactionsTable)
        .values({
          product_id: productId,
          type: 'stock_in',
          quantity: i,
          notes: `Transaction ${i}`
        })
        .execute();
      
      // Small delay to ensure timestamp ordering
      if (i < 10) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    const input: GetTransactionsInput = {
      limit: 3
    };

    const result = await getTransactions(input);

    expect(result).toHaveLength(3);
    // Should be in descending order (most recent first)
    expect(result[0].quantity).toEqual(10);
    expect(result[1].quantity).toEqual(9);
    expect(result[2].quantity).toEqual(8);
  });

  it('should handle pagination offset correctly', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create 5 transactions individually
    for (let i = 1; i <= 5; i++) {
      await db.insert(transactionsTable)
        .values({
          product_id: productId,
          type: 'stock_in',
          quantity: i,
          notes: `Transaction ${i}`
        })
        .execute();
      
      // Small delay to ensure timestamp ordering
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    const input: GetTransactionsInput = {
      limit: 2,
      offset: 2
    };

    const result = await getTransactions(input);

    expect(result).toHaveLength(2);
    // Should get items 3 and 4 (0-indexed offset of 2 from DESC order: 5,4,3,2,1)
    expect(result[0].quantity).toEqual(3); 
    expect(result[1].quantity).toEqual(2);
  });

  it('should handle transactions with null notes', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create transaction with null notes
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_in',
        quantity: 50,
        notes: null
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].quantity).toEqual(50);
  });

  it('should return transactions ordered by created_at DESC', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create first transaction
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_in',
        quantity: 10,
        notes: 'First transaction'
      })
      .execute();

    // Delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 5));

    // Create second transaction
    await db.insert(transactionsTable)
      .values({
        product_id: productId,
        type: 'stock_out',
        quantity: 5,
        notes: 'Second transaction'
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].notes).toEqual('Second transaction'); // Most recent first
    expect(result[1].notes).toEqual('First transaction');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});
