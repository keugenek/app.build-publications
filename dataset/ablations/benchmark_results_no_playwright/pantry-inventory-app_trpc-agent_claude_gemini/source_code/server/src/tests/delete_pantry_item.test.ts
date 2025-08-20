import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';
import { eq } from 'drizzle-orm';

describe('deletePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing pantry item', async () => {
    // Create a test pantry item
    const insertResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: '5.50',
        unit: 'cups',
        expiry_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const pantryItemId = insertResult[0].id;

    // Delete the pantry item
    const result = await deletePantryItem(pantryItemId);

    expect(result.success).toBe(true);

    // Verify the item is actually deleted from database
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, pantryItemId))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent item', async () => {
    // Try to delete an item that doesn't exist
    const result = await deletePantryItem(99999);

    expect(result.success).toBe(false);
  });

  it('should cascade delete related notifications', async () => {
    // Create a test pantry item
    const insertResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Expiring Item',
        quantity: '2.00',
        unit: 'pieces',
        expiry_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const pantryItemId = insertResult[0].id;

    // Create related notifications
    await db.insert(notificationsTable)
      .values([
        {
          pantry_item_id: pantryItemId,
          message: 'Item expiring soon',
          notification_type: 'expiring_soon',
          is_read: false
        },
        {
          pantry_item_id: pantryItemId,
          message: 'Item expired',
          notification_type: 'expired',
          is_read: false
        }
      ])
      .execute();

    // Verify notifications were created
    const notificationsBefore = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, pantryItemId))
      .execute();

    expect(notificationsBefore).toHaveLength(2);

    // Delete the pantry item
    const result = await deletePantryItem(pantryItemId);

    expect(result.success).toBe(true);

    // Verify notifications were cascade deleted
    const notificationsAfter = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, pantryItemId))
      .execute();

    expect(notificationsAfter).toHaveLength(0);
  });

  it('should handle multiple deletions correctly', async () => {
    // Create multiple test pantry items
    const insertResult = await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Item 1',
          quantity: '1.00',
          unit: 'pieces',
          expiry_date: new Date('2024-12-31')
        },
        {
          name: 'Item 2',
          quantity: '2.00',
          unit: 'cups',
          expiry_date: new Date('2024-12-31')
        },
        {
          name: 'Item 3',
          quantity: '3.00',
          unit: 'grams',
          expiry_date: new Date('2024-12-31')
        }
      ])
      .returning()
      .execute();

    const itemIds = insertResult.map(item => item.id);

    // Delete first item
    const result1 = await deletePantryItem(itemIds[0]);
    expect(result1.success).toBe(true);

    // Delete third item (skip second)
    const result2 = await deletePantryItem(itemIds[2]);
    expect(result2.success).toBe(true);

    // Verify correct items remain
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].name).toBe('Item 2');
    expect(remainingItems[0].id).toBe(itemIds[1]);
  });

  it('should handle deletion of item with no notifications', async () => {
    // Create a pantry item without any notifications
    const insertResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Solo Item',
        quantity: '1.50',
        unit: 'liters',
        expiry_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const pantryItemId = insertResult[0].id;

    // Ensure no notifications exist for this item
    const notificationsBefore = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, pantryItemId))
      .execute();

    expect(notificationsBefore).toHaveLength(0);

    // Delete the pantry item
    const result = await deletePantryItem(pantryItemId);

    expect(result.success).toBe(true);

    // Verify item is deleted
    const remainingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, pantryItemId))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });
});
