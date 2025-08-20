import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test pantry item
const createTestItem = async (overrides: Partial<CreatePantryItemInput> = {}) => {
  const testItem = {
    name: 'Test Item',
    quantity: 5.0,
    expiry_date: new Date('2024-12-31'),
    ...overrides
  };

  const result = await db.insert(pantryItemsTable)
    .values({
      name: testItem.name,
      quantity: testItem.quantity,
      expiry_date: testItem.expiry_date.toISOString().split('T')[0] // Convert to date string
    })
    .returning()
    .execute();

  return result[0];
};

describe('deletePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing pantry item', async () => {
    // Create a test item first
    const testItem = await createTestItem();

    // Delete the item
    const result = await deletePantryItem(testItem.id);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify item no longer exists in database
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent item', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent item
    await expect(deletePantryItem(nonExistentId))
      .rejects.toThrow(/not found/i);
  });

  it('should not affect other items when deleting one item', async () => {
    // Create multiple test items
    const item1 = await createTestItem({ name: 'Item 1' });
    const item2 = await createTestItem({ name: 'Item 2' });
    const item3 = await createTestItem({ name: 'Item 3' });

    // Delete only the second item
    const result = await deletePantryItem(item2.id);
    expect(result.success).toBe(true);

    // Verify other items still exist
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(2);
    expect(remainingItems.map(item => item.name)).toEqual(
      expect.arrayContaining(['Item 1', 'Item 3'])
    );
    expect(remainingItems.map(item => item.name)).not.toContain('Item 2');
  });

  it('should handle deletion of item with different data types', async () => {
    // Create item with various data types
    const testItem = await createTestItem({
      name: 'Complex Item',
      quantity: 2.5, // Decimal quantity
      expiry_date: new Date('2024-06-15')
    });

    // Delete the item
    const result = await deletePantryItem(testItem.id);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify item is completely removed
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should handle edge case with ID 0', async () => {
    // Attempt to delete with ID 0 (which shouldn't exist due to serial starting at 1)
    await expect(deletePantryItem(0))
      .rejects.toThrow(/not found/i);
  });

  it('should handle negative ID gracefully', async () => {
    // Attempt to delete with negative ID
    await expect(deletePantryItem(-1))
      .rejects.toThrow(/not found/i);
  });
});
