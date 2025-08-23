import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { createPantryItemInputSchema } from '../schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

// Test data
const testItem = createPantryItemInputSchema.parse({
  name: 'Test Item',
  quantity: 5,
  expiry_date: new Date('2024-12-31'),
});

describe('deletePantryItem', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test item
    await db.insert(pantryItemsTable).values({
      name: testItem.name,
      quantity: testItem.quantity,
      expiry_date: testItem.expiry_date.toISOString().split('T')[0], // Convert to string format for database
    }).execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing pantry item', async () => {
    // First, get the item we just inserted
    const items = await db.select().from(pantryItemsTable).execute();
    const itemId = items[0].id;
    
    // Delete the item
    const result = await deletePantryItem(itemId);
    
    // Verify the function returns true
    expect(result).toBe(true);
    
    // Verify the item no longer exists in the database
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, itemId))
      .execute();
    
    expect(remainingItems).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent item', async () => {
    // Try to delete an item with an ID that doesn't exist
    const result = await deletePantryItem(99999);
    
    // Verify the function returns false
    expect(result).toBe(false);
  });

  it('should only delete the specified item', async () => {
    // Insert another item
    await db.insert(pantryItemsTable).values({
      name: 'Another Item',
      quantity: 10,
      expiry_date: new Date('2025-01-01').toISOString().split('T')[0], // Convert to string format for database
    }).execute();
    
    // Get both items
    const items = await db.select().from(pantryItemsTable).execute();
    expect(items).toHaveLength(2);
    
    // Delete the first item
    const result = await deletePantryItem(items[0].id);
    expect(result).toBe(true);
    
    // Verify only one item remains
    const remainingItems = await db.select().from(pantryItemsTable).execute();
    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toBe(items[1].id);
  });
});
