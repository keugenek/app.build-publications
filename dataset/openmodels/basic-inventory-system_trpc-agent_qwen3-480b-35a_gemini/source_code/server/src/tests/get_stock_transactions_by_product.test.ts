import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getStockTransactionsByProduct } from '../handlers/get_stock_transactions_by_product';
import { type CreateProductInput, type CreateStockTransactionInput } from '../schema';

// Test data
const testProductInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST001',
  stock_quantity: 50
};

const testTransactionInput: CreateStockTransactionInput = {
  product_id: 1, // Will be updated after product creation
  transaction_type: 'IN',
  quantity: 10,
  notes: 'Initial stock'
};

describe('getStockTransactionsByProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: testProductInput.name,
        sku: testProductInput.sku,
        stock_quantity: testProductInput.stock_quantity
      })
      .returning()
      .execute();
    
    // Update the transaction input with the actual product ID
    testTransactionInput.product_id = productResult[0].id;
  });
  
  afterEach(resetDB);

  it('should return an empty array when no transactions exist for a product', async () => {
    const result = await getStockTransactionsByProduct(testTransactionInput.product_id);
    expect(result).toEqual([]);
  });

  it('should return stock transactions for a specific product', async () => {
    // Create test transactions
    await db.insert(stockTransactionsTable)
      .values({
        product_id: testTransactionInput.product_id,
        transaction_type: 'IN',
        quantity: 10,
        notes: 'Initial stock'
      })
      .execute();
      
    await db.insert(stockTransactionsTable)
      .values({
        product_id: testTransactionInput.product_id,
        transaction_type: 'OUT',
        quantity: 5,
        notes: 'Sold items'
      })
      .execute();

    const result = await getStockTransactionsByProduct(testTransactionInput.product_id);
    
    expect(result).toHaveLength(2);
    expect(result[0].product_id).toEqual(testTransactionInput.product_id);
    expect(result[1].product_id).toEqual(testTransactionInput.product_id);
    
    // Check that transactions have the correct fields
    const inTransaction = result.find(t => t.transaction_type === 'IN');
    const outTransaction = result.find(t => t.transaction_type === 'OUT');
    
    expect(inTransaction).toBeDefined();
    expect(inTransaction?.quantity).toEqual(10);
    expect(inTransaction?.notes).toEqual('Initial stock');
    
    expect(outTransaction).toBeDefined();
    expect(outTransaction?.quantity).toEqual(5);
    expect(outTransaction?.notes).toEqual('Sold items');
  });

  it('should return transactions sorted by creation date (newest first)', async () => {
    // Create test transactions
    const firstTransaction = await db.insert(stockTransactionsTable)
      .values({
        product_id: testTransactionInput.product_id,
        transaction_type: 'IN',
        quantity: 10,
        notes: 'First transaction'
      })
      .returning()
      .execute();
      
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
      
    const secondTransaction = await db.insert(stockTransactionsTable)
      .values({
        product_id: testTransactionInput.product_id,
        transaction_type: 'OUT',
        quantity: 5,
        notes: 'Second transaction'
      })
      .returning()
      .execute();

    const result = await getStockTransactionsByProduct(testTransactionInput.product_id);
    
    // Should be sorted by created_at descending (newest first)
    expect(result[0].id).toEqual(secondTransaction[0].id);
    expect(result[1].id).toEqual(firstTransaction[0].id);
  });

  it('should only return transactions for the specified product', async () => {
    // Create another product
    const secondProductResult = await db.insert(productsTable)
      .values({
        name: 'Second Product',
        sku: 'TEST002',
        stock_quantity: 30
      })
      .returning()
      .execute();
    
    // Create transactions for both products
    await db.insert(stockTransactionsTable)
      .values({
        product_id: testTransactionInput.product_id,
        transaction_type: 'IN',
        quantity: 10,
        notes: 'First product transaction'
      })
      .execute();
      
    await db.insert(stockTransactionsTable)
      .values({
        product_id: secondProductResult[0].id,
        transaction_type: 'IN',
        quantity: 20,
        notes: 'Second product transaction'
      })
      .execute();

    const result = await getStockTransactionsByProduct(testTransactionInput.product_id);
    
    // Should only return transactions for the first product
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(testTransactionInput.product_id);
    expect(result[0].notes).toEqual('First product transaction');
  });
});
