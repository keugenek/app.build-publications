import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { type GetExpiryNotificationsInput } from '../schema';
import { getExpiryNotifications } from '../handlers/get_expiry_notifications';
import { eq } from 'drizzle-orm';

describe('getExpiryNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return notifications for items expiring within days_ahead', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Create pantry item expiring tomorrow
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Expiring Milk',
        quantity: '1.5',
        unit: 'liters',
        expiry_date: tomorrow
      })
      .returning()
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 7,
      include_expired: true
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].pantry_item_id).toEqual(pantryItemResult[0].id);
    expect(notifications[0].notification_type).toEqual('expiring_soon');
    expect(notifications[0].message).toContain('Expiring Milk');
    expect(notifications[0].message).toContain('will expire on');
    expect(notifications[0].is_read).toBe(false);
    expect(notifications[0].created_at).toBeInstanceOf(Date);
  });

  it('should return notifications for expired items when include_expired is true', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Create expired pantry item
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Expired Bread',
        quantity: '1',
        unit: 'loaf',
        expiry_date: yesterday
      })
      .returning()
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 3,
      include_expired: true
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].pantry_item_id).toEqual(pantryItemResult[0].id);
    expect(notifications[0].notification_type).toEqual('expired');
    expect(notifications[0].message).toContain('Expired Bread');
    expect(notifications[0].message).toContain('has expired on');
    expect(notifications[0].is_read).toBe(false);
  });

  it('should not return expired notifications when include_expired is false', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Create expired pantry item
    await db.insert(pantryItemsTable)
      .values({
        name: 'Expired Cheese',
        quantity: '200',
        unit: 'grams',
        expiry_date: yesterday
      })
      .returning()
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 3,
      include_expired: false
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(0);
  });

  it('should not duplicate notifications for same item and type', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create pantry item
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: '1',
        unit: 'piece',
        expiry_date: tomorrow
      })
      .returning()
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 7,
      include_expired: true
    };

    // Call handler twice
    const firstCall = await getExpiryNotifications(input);
    const secondCall = await getExpiryNotifications(input);

    expect(firstCall).toHaveLength(1);
    expect(secondCall).toHaveLength(1);

    // Verify only one notification exists in database
    const allNotifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, pantryItemResult[0].id))
      .execute();

    expect(allNotifications).toHaveLength(1);
  });

  it('should handle multiple items with different expiry statuses', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 10);

    // Create multiple pantry items
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Expired Item',
          quantity: '1',
          unit: 'piece',
          expiry_date: yesterday
        },
        {
          name: 'Expiring Soon',
          quantity: '2',
          unit: 'pieces',
          expiry_date: tomorrow
        },
        {
          name: 'Fresh Item',
          quantity: '3',
          unit: 'pieces',
          expiry_date: nextWeek
        }
      ])
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 3,
      include_expired: true
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(2);
    
    const expiredNotification = notifications.find(n => n.notification_type === 'expired');
    const expiringSoonNotification = notifications.find(n => n.notification_type === 'expiring_soon');
    
    expect(expiredNotification).toBeDefined();
    expect(expiredNotification?.message).toContain('Expired Item');
    expect(expiredNotification?.message).toContain('has expired');
    
    expect(expiringSoonNotification).toBeDefined();
    expect(expiringSoonNotification?.message).toContain('Expiring Soon');
    expect(expiringSoonNotification?.message).toContain('will expire');
  });

  it('should respect days_ahead parameter', async () => {
    const today = new Date();
    const in5Days = new Date(today);
    in5Days.setDate(today.getDate() + 5);
    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);

    // Create pantry items with different expiry dates
    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Item Expiring in 5 Days',
          quantity: '1',
          unit: 'piece',
          expiry_date: in5Days
        },
        {
          name: 'Item Expiring in 10 Days',
          quantity: '1',
          unit: 'piece',
          expiry_date: in10Days
        }
      ])
      .execute();

    // Test with days_ahead = 7 (should only get the 5-day item)
    const input: GetExpiryNotificationsInput = {
      days_ahead: 7,
      include_expired: false
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('Item Expiring in 5 Days');
  });

  it('should return empty array when no items are expiring', async () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Create item that won't expire soon
    await db.insert(pantryItemsTable)
      .values({
        name: 'Fresh Item',
        quantity: '1',
        unit: 'piece',
        expiry_date: nextMonth
      })
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 7,
      include_expired: false
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(0);
  });

  it('should handle items expiring exactly on the threshold', async () => {
    const today = new Date();
    const exactlyInThreeDays = new Date(today);
    exactlyInThreeDays.setDate(today.getDate() + 3);

    // Create item expiring exactly in 3 days
    const pantryItemResult = await db.insert(pantryItemsTable)
      .values({
        name: 'Threshold Item',
        quantity: '1',
        unit: 'piece',
        expiry_date: exactlyInThreeDays
      })
      .returning()
      .execute();

    const input: GetExpiryNotificationsInput = {
      days_ahead: 3,
      include_expired: false
    };

    const notifications = await getExpiryNotifications(input);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].pantry_item_id).toEqual(pantryItemResult[0].id);
    expect(notifications[0].notification_type).toEqual('expiring_soon');
  });
});
