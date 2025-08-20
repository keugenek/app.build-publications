import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { type MarkNotificationReadInput } from '../schema';
import { markNotificationRead } from '../handlers/mark_notification_read';
import { eq } from 'drizzle-orm';

describe('markNotificationRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark notification as read', async () => {
    // Create a test pantry item first
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: '1.5',
        unit: 'cups',
        expiry_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const pantryItemId = pantryItemResult[0].id;

    // Create a test notification
    const notificationResult = await db.insert(notificationsTable)
      .values({
        pantry_item_id: pantryItemId,
        message: 'Item expiring soon',
        notification_type: 'expiring_soon',
        is_read: false
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    const input: MarkNotificationReadInput = {
      id: notificationId
    };

    const result = await markNotificationRead(input);

    // Verify the result
    expect(result.id).toEqual(notificationId);
    expect(result.pantry_item_id).toEqual(pantryItemId);
    expect(result.message).toEqual('Item expiring soon');
    expect(result.notification_type).toEqual('expiring_soon');
    expect(result.is_read).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update notification in database', async () => {
    // Create a test pantry item first
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: '2.0',
        unit: 'pieces',
        expiry_date: new Date('2024-12-25')
      })
      .returning()
      .execute();

    const pantryItemId = pantryItemResult[0].id;

    // Create a test notification
    const notificationResult = await db.insert(notificationsTable)
      .values({
        pantry_item_id: pantryItemId,
        message: 'Item has expired',
        notification_type: 'expired',
        is_read: false
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    const input: MarkNotificationReadInput = {
      id: notificationId
    };

    await markNotificationRead(input);

    // Verify the notification was updated in the database
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].is_read).toBe(true);
    expect(notifications[0].message).toEqual('Item has expired');
    expect(notifications[0].notification_type).toEqual('expired');
  });

  it('should throw error for non-existent notification', async () => {
    const input: MarkNotificationReadInput = {
      id: 999999 // Non-existent ID
    };

    await expect(markNotificationRead(input)).rejects.toThrow(/not found/i);
  });

  it('should handle already read notifications', async () => {
    // Create a test pantry item first
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Already Read Item',
        quantity: '0.5',
        unit: 'kg',
        expiry_date: new Date('2024-11-30')
      })
      .returning()
      .execute();

    const pantryItemId = pantryItemResult[0].id;

    // Create a notification that's already read
    const notificationResult = await db.insert(notificationsTable)
      .values({
        pantry_item_id: pantryItemId,
        message: 'Item expiring in 3 days',
        notification_type: 'expiring_soon',
        is_read: true // Already read
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    const input: MarkNotificationReadInput = {
      id: notificationId
    };

    const result = await markNotificationRead(input);

    // Should still work and return the notification
    expect(result.id).toEqual(notificationId);
    expect(result.is_read).toBe(true);
    expect(result.message).toEqual('Item expiring in 3 days');
    expect(result.notification_type).toEqual('expiring_soon');

    // Verify it's still marked as read in database
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notifications[0].is_read).toBe(true);
  });
});
