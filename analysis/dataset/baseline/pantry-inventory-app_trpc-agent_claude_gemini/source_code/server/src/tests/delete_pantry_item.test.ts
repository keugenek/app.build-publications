import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type DeletePantryItemInput, type CreatePantryItemInput } from '../schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test pantry item
const createTestPantryItem = async (input: CreatePantryItemInput) => {
  const result = await db.insert(pantryItemsTable)
    .values({
      name: input.name,
      quantity: input.quantity.toString(),
      expiry_date: input.expiry_date.toISOString().split('T')[0] // Convert Date to string for date column
    })
    .returning()
    .execute();

  const item = result[0];
  return {
    ...item,
    quantity: parseFloat(item.quantity), // Convert back to number
    expiry_date: new Date(item.expiry_date + 'T00:00:00Z') // Convert string back to Date
  };
};

// Test input for creating pantry items
const testCreateInput: CreatePantryItemInput = {
  name: 'Test Apple',
  quantity: 5,
  expiry_date: new Date('2024-12-31')
};

describe('deletePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing pantry item successfully', async () => {
    // Create a test item first
    const createdItem = await createTestPantryItem(testCreateInput);

    // Delete the item
    const deleteInput: DeletePantryItemInput = { id: createdItem.id };
    const result = await deletePantryItem(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify item is no longer in database
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent item', async () => {
    const deleteInput: DeletePantryItemInput = { id: 999 };

    // Should throw error for non-existent item
    await expect(deletePantryItem(deleteInput))
      .rejects.toThrow(/not found/i);
  });

  it('should not affect other pantry items when deleting one item', async () => {
    // Create multiple test items
    const item1 = await createTestPantryItem({
      name: 'Apple',
      quantity: 5,
      expiry_date: new Date('2024-12-31')
    });

    const item2 = await createTestPantryItem({
      name: 'Banana', 
      quantity: 3,
      expiry_date: new Date('2024-12-25')
    });

    const item3 = await createTestPantryItem({
      name: 'Orange',
      quantity: 7,
      expiry_date: new Date('2024-12-30')
    });

    // Delete only the middle item
    const deleteInput: DeletePantryItemInput = { id: item2.id };
    const result = await deletePantryItem(deleteInput);

    expect(result.success).toBe(true);

    // Verify other items still exist
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(2);

    // Verify the correct items remain
    const remainingIds = remainingItems.map(item => item.id);
    expect(remainingIds).toContain(item1.id);
    expect(remainingIds).toContain(item3.id);
    expect(remainingIds).not.toContain(item2.id);
  });

  it('should handle deletion with various item quantities and dates', async () => {
    // Test with decimal quantity
    const itemWithDecimal = await createTestPantryItem({
      name: 'Milk',
      quantity: 2.5,
      expiry_date: new Date('2024-12-20')
    });

    // Test with large quantity
    const itemWithLargeQuantity = await createTestPantryItem({
      name: 'Rice',
      quantity: 1000,
      expiry_date: new Date('2025-06-01')
    });

    // Delete item with decimal quantity
    let result = await deletePantryItem({ id: itemWithDecimal.id });
    expect(result.success).toBe(true);

    // Delete item with large quantity
    result = await deletePantryItem({ id: itemWithLargeQuantity.id });
    expect(result.success).toBe(true);

    // Verify both items are deleted
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should verify database state after multiple deletions', async () => {
    // Create several items
    const items = await Promise.all([
      createTestPantryItem({ name: 'Item1', quantity: 1, expiry_date: new Date('2024-12-31') }),
      createTestPantryItem({ name: 'Item2', quantity: 2, expiry_date: new Date('2024-12-31') }),
      createTestPantryItem({ name: 'Item3', quantity: 3, expiry_date: new Date('2024-12-31') }),
      createTestPantryItem({ name: 'Item4', quantity: 4, expiry_date: new Date('2024-12-31') })
    ]);

    // Delete items in reverse order
    for (let i = items.length - 1; i >= 0; i--) {
      const result = await deletePantryItem({ id: items[i].id });
      expect(result.success).toBe(true);

      // Check remaining count after each deletion
      const remaining = await db.select().from(pantryItemsTable).execute();
      expect(remaining).toHaveLength(i);
    }

    // Final verification - no items should remain
    const finalItems = await db.select().from(pantryItemsTable).execute();
    expect(finalItems).toHaveLength(0);
  });
});
