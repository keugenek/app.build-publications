import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable, transactionsTable } from '../db/schema';
import { type CreateItemInput, type CreateTransactionInput } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to create an item (since we don't have the createItem handler yet)
const createItemHelper = async (input: Omit<CreateItemInput, 'stock'> & { stock?: number }) => {
  const result = await db.insert(itemsTable)
    .values({
      name: input.name,
      code: input.code,
      description: input.description,
      stock: input.stock ?? 0
    })
    .returning()
    .execute();
  
  return result[0];
};

// Helper function to create a transaction (since we don't have the createTransaction handler yet)
const createTransactionHelper = async (input: CreateTransactionInput) => {
  const result = await db.insert(transactionsTable)
    .values({
      item_id: input.item_id,
      type: input.type,
      quantity: input.quantity
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an item without transactions', async () => {
    // First create an item
    const item = await createItemHelper({
      name: 'Test Item',
      code: 'TEST001',
      description: 'A test item',
      stock: 10
    });

    // Import the handler here to avoid issues with circular dependencies
    const { deleteItem } = await import('../handlers/delete_item');
    
    // Delete the item
    const result = await deleteItem({ id: item.id });

    // Check that deletion was successful
    expect(result).toBe(true);

    // Verify item no longer exists in database
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should delete an item and its associated transactions', async () => {
    // First create an item
    const item = await createItemHelper({
      name: 'Test Item',
      code: 'TEST001',
      description: 'A test item',
      stock: 10
    });

    // Create transactions for this item
    await createTransactionHelper({
      item_id: item.id,
      type: 'in',
      quantity: 5
    });

    await createTransactionHelper({
      item_id: item.id,
      type: 'out',
      quantity: 2
    });

    // Verify transactions exist
    const transactionsBefore = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.item_id, item.id))
      .execute();

    expect(transactionsBefore).toHaveLength(2);

    // Import the handler here to avoid issues with circular dependencies
    const { deleteItem } = await import('../handlers/delete_item');
    
    // Delete the item
    const result = await deleteItem({ id: item.id });

    // Check that deletion was successful
    expect(result).toBe(true);

    // Verify item no longer exists in database
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();

    expect(items).toHaveLength(0);

    // Verify transactions no longer exist
    const transactionsAfter = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.item_id, item.id))
      .execute();

    expect(transactionsAfter).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent item', async () => {
    // Import the handler here to avoid issues with circular dependencies
    const { deleteItem } = await import('../handlers/delete_item');
    
    // Try to delete an item that doesn't exist
    const result = await deleteItem({ id: 99999 });

    // Check that deletion was not successful
    expect(result).toBe(false);
  });
});
