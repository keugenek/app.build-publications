import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type CreateStockTransactionInput } from '../schema';
import { createStockTransaction } from '../handlers/create_stock_transaction';
import { eq } from 'drizzle-orm';

describe('createStockTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product directly in the database
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TP001',
        stockLevel: 10
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a STOCK_IN transaction and increase product stock', async () => {
    // Create a STOCK_IN transaction
    const transactionInput: CreateStockTransactionInput = {
      productId: 1, // ID of the product we created
      quantity: 5,
      transactionType: 'STOCK_IN'
    };

    const transaction = await createStockTransaction(transactionInput);

    // Validate transaction
    expect(transaction.productId).toBe(1);
    expect(transaction.quantity).toBe(5);
    expect(transaction.transactionType).toBe('STOCK_IN');
    expect(transaction.id).toBeDefined();
    expect(transaction.transactionDate).toBeInstanceOf(Date);

    // Validate product stock level was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(updatedProduct[0].stockLevel).toBe(15); // 10 + 5

    // Validate transaction was saved to database
    const savedTransactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.id, transaction.id))
      .execute();

    expect(savedTransactions).toHaveLength(1);
    expect(savedTransactions[0].productId).toBe(1);
    expect(savedTransactions[0].quantity).toBe(5);
    expect(savedTransactions[0].transactionType).toBe('STOCK_IN');
  });

  it('should create a STOCK_OUT transaction and decrease product stock', async () => {
    // First update product to have sufficient stock
    await db.update(productsTable)
      .set({ stockLevel: 20 })
      .where(eq(productsTable.id, 1))
      .execute();
    
    // Create a STOCK_OUT transaction
    const transactionInput: CreateStockTransactionInput = {
      productId: 1,
      quantity: 8,
      transactionType: 'STOCK_OUT'
    };

    const transaction = await createStockTransaction(transactionInput);

    // Validate transaction
    expect(transaction.productId).toBe(1);
    expect(transaction.quantity).toBe(8);
    expect(transaction.transactionType).toBe('STOCK_OUT');

    // Validate product stock level was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(updatedProduct[0].stockLevel).toBe(12); // 20 - 8
  });

  it('should prevent STOCK_OUT transaction that would result in negative stock', async () => {
    // Update product to have limited stock
    await db.update(productsTable)
      .set({ stockLevel: 3 })
      .where(eq(productsTable.id, 1))
      .execute();
    
    // Try to create a STOCK_OUT transaction that exceeds available stock
    const transactionInput: CreateStockTransactionInput = {
      productId: 1,
      quantity: 5, // More than available stock (3)
      transactionType: 'STOCK_OUT'
    };

    // This should fail
    await expect(createStockTransaction(transactionInput)).rejects.toThrow(/insufficient stock/i);

    // Product stock level should remain unchanged
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(updatedProduct[0].stockLevel).toBe(3); // Should be unchanged
  });

  it('should throw an error when product does not exist', async () => {
    const transactionInput: CreateStockTransactionInput = {
      productId: 99999, // Non-existent product ID
      quantity: 5,
      transactionType: 'STOCK_IN'
    };

    await expect(createStockTransaction(transactionInput)).rejects.toThrow(/not found/i);
  });
});
