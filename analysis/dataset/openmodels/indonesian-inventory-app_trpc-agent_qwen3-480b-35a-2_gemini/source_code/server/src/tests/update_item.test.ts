import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type UpdateItemInput } from '../schema';
import { updateItem } from '../handlers/update_item';
import { eq } from 'drizzle-orm';

// Test data for creating an item
const testItemData = {
  name: 'Test Item',
  code: 'TEST-001',
  description: 'A test item',
  stock: 10
};

// Test data for updating an item
const updateItemInput: UpdateItemInput = {
  id: 1,
  name: 'Updated Test Item',
  code: 'TEST-002',
  description: 'An updated test item',
  stock: 20
};

describe('updateItem', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test item first using direct DB insert
    await db.insert(itemsTable).values(testItemData).execute();
  });
  
  afterEach(resetDB);

  it('should update an item with all fields provided', async () => {
    const result = await updateItem(updateItemInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Test Item');
    expect(result.code).toEqual('TEST-002');
    expect(result.description).toEqual('An updated test item');
    expect(result.stock).toEqual(20);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update only provided fields', async () => {
    // Get the original item first to check unchanged fields
    const [originalItem] = await db.select().from(itemsTable).where(eq(itemsTable.id, 1)).execute();
    
    // Update only name and stock
    const partialUpdateInput: UpdateItemInput = {
      id: 1,
      name: 'Partially Updated Item',
      stock: 15
    };

    const result = await updateItem(partialUpdateInput);

    // Check updated fields
    expect(result.name).toEqual('Partially Updated Item');
    expect(result.stock).toEqual(15);
    
    // Check that other fields remain unchanged
    expect(result.code).toEqual(originalItem.code);
    expect(result.description).toEqual(originalItem.description);
    
    // Check timestamps
    expect(result.created_at).toEqual(originalItem.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(originalItem.updated_at.getTime());
  });

  it('should save updated item to database', async () => {
    await updateItem(updateItemInput);

    // Query the database to verify the update was persisted
    const [updatedItem] = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, 1))
      .execute();

    expect(updatedItem).toBeDefined();
    expect(updatedItem.name).toEqual('Updated Test Item');
    expect(updatedItem.code).toEqual('TEST-002');
    expect(updatedItem.description).toEqual('An updated test item');
    expect(updatedItem.stock).toEqual(20);
    expect(updatedItem.created_at).toBeInstanceOf(Date);
    expect(updatedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent item', async () => {
    const invalidUpdateInput: UpdateItemInput = {
      id: 999,
      name: 'Non-existent Item'
    };

    await expect(updateItem(invalidUpdateInput)).rejects.toThrow(/not found/);
  });
});
