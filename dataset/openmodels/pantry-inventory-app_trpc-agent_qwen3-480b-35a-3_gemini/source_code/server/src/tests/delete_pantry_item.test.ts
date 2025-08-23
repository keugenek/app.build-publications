import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

describe('deletePantryItem', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test pantry item directly into the database
    await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: 5,
        expiry_date: '2024-12-31',
        category: 'Dairy'
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing pantry item', async () => {
    // Delete the pantry item with ID 1 (the one we inserted)
    const result = await deletePantryItem(1);
    
    // Check that the deletion was successful
    expect(result).toBe(true);
    
    // Verify the item no longer exists in the database
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, 1))
      .execute();
    
    expect(items).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent item', async () => {
    // Try to delete an item that doesn't exist
    const result = await deletePantryItem(99999);
    
    // Should return false since no item was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified item', async () => {
    // Insert another pantry item
    const result = await db.insert(pantryItemsTable)
      .values({
        name: 'Another Item',
        quantity: 10,
        expiry_date: '2025-01-15',
        category: 'Produce'
      })
      .returning()
      .execute();
      
    const secondItemId = result[0].id;
    
    // Delete only the first item (ID 1)
    const deleteResult = await deletePantryItem(1);
    
    expect(deleteResult).toBe(true);
    
    // Verify that item with ID 1 is deleted but the second item still exists
    const allItems = await db.select()
      .from(pantryItemsTable)
      .execute();
    
    expect(allItems).toHaveLength(1);
    expect(allItems[0].id).toBe(secondItemId);
  });
});
