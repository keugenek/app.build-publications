import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

// Test pantry item data
const testPantryItem: CreatePantryItemInput = {
  name: 'Test Milk',
  quantity: 2.5,
  unit: 'liters',
  expiration_date: new Date('2024-12-31'),
  category: 'dairy',
  notes: 'Fresh whole milk'
};

describe('deletePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing pantry item', async () => {
    // Create a test item first
    const createResult = await db.insert(pantryItemsTable)
      .values({
        name: testPantryItem.name,
        quantity: testPantryItem.quantity.toString(),
        unit: testPantryItem.unit,
        expiration_date: testPantryItem.expiration_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        category: testPantryItem.category,
        notes: testPantryItem.notes
      })
      .returning()
      .execute();

    const createdItem = createResult[0];
    expect(createdItem.id).toBeDefined();

    // Delete the item
    await deletePantryItem(createdItem.id);

    // Verify the item is deleted
    const deletedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should throw error when deleting non-existent item', async () => {
    const nonExistentId = 99999;

    await expect(deletePantryItem(nonExistentId))
      .rejects.toThrow(/Pantry item with ID 99999 not found/i);
  });

  it('should not affect other pantry items when deleting', async () => {
    // Create multiple test items
    const createResults = await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Milk',
          quantity: '2.5',
          unit: 'liters',
          expiration_date: '2024-12-31',
          category: 'dairy',
          notes: null
        },
        {
          name: 'Bread',
          quantity: '1',
          unit: 'loaf',
          expiration_date: '2024-01-15',
          category: 'bakery',
          notes: 'Whole wheat'
        },
        {
          name: 'Apples',
          quantity: '6',
          unit: 'pieces',
          expiration_date: '2024-01-20',
          category: 'fruits',
          notes: null
        }
      ])
      .returning()
      .execute();

    expect(createResults).toHaveLength(3);

    // Delete the middle item
    const itemToDelete = createResults[1];
    await deletePantryItem(itemToDelete.id);

    // Verify only the targeted item is deleted
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(2);
    expect(remainingItems.map(item => item.name)).toEqual(['Milk', 'Apples']);

    // Verify the deleted item is not in the remaining items
    const deletedItemExists = remainingItems.find(item => item.id === itemToDelete.id);
    expect(deletedItemExists).toBeUndefined();
  });

  it('should handle deletion of items with different data types correctly', async () => {
    // Create item with various data types
    const createResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Cheese Block',
        quantity: '0.75',
        unit: 'kg',
        expiration_date: '2024-02-14',
        category: null, // Test null category
        notes: null // Test null notes
      })
      .returning()
      .execute();

    const createdItem = createResult[0];

    // Delete the item
    await deletePantryItem(createdItem.id);

    // Verify deletion
    const deletedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });
});
