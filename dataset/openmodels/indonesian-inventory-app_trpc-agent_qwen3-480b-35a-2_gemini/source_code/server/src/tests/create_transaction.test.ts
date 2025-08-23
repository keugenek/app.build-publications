import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable, transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTransactionInput, type CreateItemInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';

// Helper function to create an item (since we don't have a createItem handler yet)
const createItem = async (input: CreateItemInput) => {
  const result = await db.insert(itemsTable)
    .values({
      name: input.name,
      code: input.code,
      description: input.description,
      stock: input.stock
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test inputs
const testItemInput: CreateItemInput = {
  name: 'Test Item',
  code: 'TEST001',
  description: 'A test item',
  stock: 50
};

const testTransactionInput: CreateTransactionInput = {
  item_id: 1,
  type: 'in',
  quantity: 10
};

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an incoming transaction and increase item stock', async () => {
    // First create an item
    const item = await createItem(testItemInput);
    
    // Create transaction input with the actual item id
    const transactionInput: CreateTransactionInput = {
      item_id: item.id,
      type: 'in',
      quantity: 10
    };
    
    const result = await createTransaction(transactionInput);

    // Validate transaction
    expect(result.item_id).toEqual(item.id);
    expect(result.type).toEqual('in');
    expect(result.quantity).toEqual(10);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Validate that item stock was updated
    const updatedItem = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    
    expect(updatedItem[0].stock).toEqual(60); // 50 + 10
  });

  it('should create an outgoing transaction and decrease item stock', async () => {
    // First create an item
    const item = await createItem(testItemInput);
    
    // Create transaction input with the actual item id
    const transactionInput: CreateTransactionInput = {
      item_id: item.id,
      type: 'out',
      quantity: 5
    };
    
    const result = await createTransaction(transactionInput);

    // Validate transaction
    expect(result.item_id).toEqual(item.id);
    expect(result.type).toEqual('out');
    expect(result.quantity).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Validate that item stock was updated
    const updatedItem = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    
    expect(updatedItem[0].stock).toEqual(45); // 50 - 5
  });

  it('should not allow item stock to go below zero', async () => {
    // Create an item with low stock
    const itemInput: CreateItemInput = {
      name: 'Low Stock Item',
      code: 'LOW001',
      description: 'Item with low stock',
      stock: 3
    };
    
    const item = await createItem(itemInput);
    
    // Try to create an outgoing transaction that would make stock negative
    const transactionInput: CreateTransactionInput = {
      item_id: item.id,
      type: 'out',
      quantity: 5 // More than available stock
    };
    
    const result = await createTransaction(transactionInput);

    // Validate transaction
    expect(result.item_id).toEqual(item.id);
    expect(result.type).toEqual('out');
    expect(result.quantity).toEqual(5);
    expect(result.id).toBeDefined();
    
    // Validate that item stock was set to zero (not negative)
    const updatedItem = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    
    expect(updatedItem[0].stock).toEqual(0); // Should be 0, not -2
  });

  it('should save transaction to database', async () => {
    // First create an item
    const item = await createItem(testItemInput);
    
    // Create transaction input with the actual item id
    const transactionInput: CreateTransactionInput = {
      item_id: item.id,
      type: 'in',
      quantity: 7
    };
    
    const result = await createTransaction(transactionInput);

    // Query the transaction from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].item_id).toEqual(item.id);
    expect(transactions[0].type).toEqual('in');
    expect(transactions[0].quantity).toEqual(7);
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when item does not exist', async () => {
    const transactionInput: CreateTransactionInput = {
      item_id: 99999, // Non-existent item
      type: 'in',
      quantity: 5
    };

    await expect(createTransaction(transactionInput)).rejects.toThrow(/not found/i);
  });
});
