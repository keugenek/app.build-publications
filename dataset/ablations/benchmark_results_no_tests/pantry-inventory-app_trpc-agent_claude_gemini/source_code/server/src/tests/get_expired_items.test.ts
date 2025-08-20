import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getExpiredItems } from '../handlers/get_expired_items';

describe('getExpiredItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only expired items', async () => {
    // Create test data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Expired Milk',
          quantity: 1.5,
          expiry_date: yesterday.toISOString().split('T')[0] // Convert to YYYY-MM-DD
        },
        {
          name: 'Fresh Bread',
          quantity: 2,
          expiry_date: tomorrow.toISOString().split('T')[0]
        },
        {
          name: 'Very Expired Cheese',
          quantity: 0.5,
          expiry_date: weekAgo.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getExpiredItems();

    expect(result).toHaveLength(2);
    expect(result.every(item => item.expiry_status === 'expired')).toBe(true);
    expect(result.every(item => item.days_until_expiry < 0)).toBe(true);
    
    // Check that fresh item is not included
    expect(result.find(item => item.name === 'Fresh Bread')).toBeUndefined();
  });

  it('should sort expired items by expiry date (most recently expired first)', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    await db.insert(pantryItemsTable)
      .values([
        {
          name: 'Very Expired Item',
          quantity: 1,
          expiry_date: weekAgo.toISOString().split('T')[0]
        },
        {
          name: 'Recently Expired Item',
          quantity: 1,
          expiry_date: yesterday.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getExpiredItems();

    expect(result).toHaveLength(2);
    // Most recently expired should be first
    expect(result[0].name).toBe('Recently Expired Item');
    expect(result[1].name).toBe('Very Expired Item');
  });

  it('should calculate days_until_expiry correctly for expired items', async () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.insert(pantryItemsTable)
      .values({
        name: 'Expired Yogurt',
        quantity: 1,
        expiry_date: threeDaysAgo.toISOString().split('T')[0]
      })
      .execute();

    const result = await getExpiredItems();

    expect(result).toHaveLength(1);
    expect(result[0].days_until_expiry).toBe(-3);
    expect(result[0].expiry_status).toBe('expired');
  });

  it('should return empty array when no items are expired', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(pantryItemsTable)
      .values({
        name: 'Fresh Item',
        quantity: 1,
        expiry_date: tomorrow.toISOString().split('T')[0]
      })
      .execute();

    const result = await getExpiredItems();

    expect(result).toHaveLength(0);
  });

  it('should convert quantity to number correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(pantryItemsTable)
      .values({
        name: 'Expired Item',
        quantity: 2.5, // Decimal quantity
        expiry_date: yesterday.toISOString().split('T')[0]
      })
      .execute();

    const result = await getExpiredItems();

    expect(result).toHaveLength(1);
    expect(typeof result[0].quantity).toBe('number');
    expect(result[0].quantity).toBe(2.5);
  });

  it('should handle items expiring exactly today', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.insert(pantryItemsTable)
      .values({
        name: 'Expires Today',
        quantity: 1,
        expiry_date: today.toISOString().split('T')[0]
      })
      .execute();

    const result = await getExpiredItems();

    // Items expiring today should NOT be included (only items expired before today)
    expect(result).toHaveLength(0);
  });
});
