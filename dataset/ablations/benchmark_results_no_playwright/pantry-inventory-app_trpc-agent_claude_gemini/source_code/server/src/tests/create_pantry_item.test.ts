import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Test inputs for different scenarios
const testInput: CreatePantryItemInput = {
  name: 'Test Apple',
  quantity: 5,
  unit: 'pieces',
  expiry_date: new Date('2024-12-31')
};

const expiredItemInput: CreatePantryItemInput = {
  name: 'Expired Milk',
  quantity: 1,
  unit: 'liter',
  expiry_date: new Date('2023-01-01') // Already expired
};

const expiringSoonInput: CreatePantryItemInput = {
  name: 'Soon to Expire Bread',
  quantity: 2,
  unit: 'loaves',
  expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item with basic fields', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Apple');
    expect(result.quantity).toEqual(5);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('pieces');
    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.added_date).toBeInstanceOf(Date);
  });

  it('should save pantry item to database', async () => {
    const result = await createPantryItem(testInput);

    // Query using proper drizzle syntax
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(pantryItems).toHaveLength(1);
    expect(pantryItems[0].name).toEqual('Test Apple');
    expect(parseFloat(pantryItems[0].quantity)).toEqual(5);
    expect(pantryItems[0].unit).toEqual('pieces');
    expect(pantryItems[0].expiry_date).toBeInstanceOf(Date);
    expect(pantryItems[0].added_date).toBeInstanceOf(Date);
  });

  it('should include computed fields for expiry status', async () => {
    const result = await createPantryItem(testInput);

    expect(result.is_expired).toBeDefined();
    expect(result.days_until_expiry).toBeDefined();
    expect(typeof result.is_expired).toBe('boolean');
    expect(typeof result.days_until_expiry).toBe('number');
  });

  it('should create notification for expired item', async () => {
    const result = await createPantryItem(expiredItemInput);

    // Check that item is marked as expired
    expect(result.is_expired).toBe(true);
    expect(result.days_until_expiry).toBeLessThanOrEqual(0);

    // Check notification was created
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('has expired');
    expect(notifications[0].notification_type).toEqual('expired');
    expect(notifications[0].is_read).toBe(false);
  });

  it('should create notification for item expiring soon', async () => {
    const result = await createPantryItem(expiringSoonInput);

    // Check that item is not expired but expiring soon
    expect(result.is_expired).toBe(false);
    expect(result.days_until_expiry).toBeLessThanOrEqual(7);
    expect(result.days_until_expiry).toBeGreaterThan(0);

    // Check notification was created
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('expires in');
    expect(notifications[0].notification_type).toEqual('expiring_soon');
    expect(notifications[0].is_read).toBe(false);
  });

  it('should not create notification for item with distant expiry', async () => {
    const distantExpiryInput: CreatePantryItemInput = {
      name: 'Canned Beans',
      quantity: 3,
      unit: 'cans',
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    };

    const result = await createPantryItem(distantExpiryInput);

    // Check that item is not expired and has many days until expiry
    expect(result.is_expired).toBe(false);
    expect(result.days_until_expiry).toBeGreaterThan(7);

    // Check no notification was created
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, result.id))
      .execute();

    expect(notifications).toHaveLength(0);
  });

  it('should handle decimal quantities correctly', async () => {
    const decimalInput: CreatePantryItemInput = {
      name: 'Olive Oil',
      quantity: 0.5,
      unit: 'liters',
      expiry_date: new Date('2024-12-31')
    };

    const result = await createPantryItem(decimalInput);

    expect(result.quantity).toEqual(0.5);
    expect(typeof result.quantity).toBe('number');

    // Verify in database
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(parseFloat(pantryItems[0].quantity)).toEqual(0.5);
  });

  it('should handle singular vs plural days correctly in notification', async () => {
    const oneDayInput: CreatePantryItemInput = {
      name: 'Tomorrow Expiry',
      quantity: 1,
      unit: 'item',
      expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
    };

    const result = await createPantryItem(oneDayInput);

    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.pantry_item_id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('expires in 1 day'); // Should be singular "day"
    expect(notifications[0].message).not.toContain('days');
  });
});
