import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type ExpiringItemsRequest } from '../schema';
import { getExpiringItems } from '../handlers/get_expiring_items';

// Test input with default value
const testInput: ExpiringItemsRequest = {
  days_ahead: 7
};

describe('getExpiringItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items expiring within specified days', async () => {
    // Create test items with various expiry dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 6);
    const farFuture = new Date(today);
    farFuture.setDate(farFuture.getDate() + 30);

    // Insert test data
    await db.insert(pantryItemsTable).values([
      {
        name: 'Expiring Tomorrow',
        quantity: '2.5',
        expiry_date: tomorrow.toISOString().split('T')[0]
      },
      {
        name: 'Expiring Next Week',
        quantity: '1.0',
        expiry_date: nextWeek.toISOString().split('T')[0]
      },
      {
        name: 'Future Item',
        quantity: '3.0',
        expiry_date: farFuture.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getExpiringItems(testInput);

    // Should return items expiring within 7 days (tomorrow and next week)
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Expiring Tomorrow');
    expect(result[1].name).toEqual('Expiring Next Week');
    
    // Verify numeric conversion
    expect(typeof result[0].quantity).toBe('number');
    expect(result[0].quantity).toEqual(2.5);
    expect(result[1].quantity).toEqual(1.0);
  });

  it('should return items ordered by expiry date (soonest first)', async () => {
    const today = new Date();
    const date1 = new Date(today);
    date1.setDate(today.getDate() + 5);
    const date2 = new Date(today);
    date2.setDate(today.getDate() + 2);
    const date3 = new Date(today);
    date3.setDate(today.getDate() + 7);

    // Insert items in non-chronological order
    await db.insert(pantryItemsTable).values([
      {
        name: 'Item A',
        quantity: '1.0',
        expiry_date: date1.toISOString().split('T')[0] // Day 5
      },
      {
        name: 'Item B',
        quantity: '2.0',
        expiry_date: date2.toISOString().split('T')[0] // Day 2
      },
      {
        name: 'Item C',
        quantity: '3.0',
        expiry_date: date3.toISOString().split('T')[0] // Day 7
      }
    ]).execute();

    const result = await getExpiringItems(testInput);

    expect(result).toHaveLength(3);
    // Should be ordered by expiry date (soonest first)
    expect(result[0].name).toEqual('Item B'); // Day 2
    expect(result[1].name).toEqual('Item A'); // Day 5
    expect(result[2].name).toEqual('Item C'); // Day 7
  });

  it('should return empty array when no items are expiring', async () => {
    // Create items that expire far in the future
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Future Item',
        quantity: '1.0',
        expiry_date: farFuture.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getExpiringItems(testInput);

    expect(result).toHaveLength(0);
  });

  it('should respect custom days_ahead parameter', async () => {
    const today = new Date();
    const day2 = new Date(today);
    day2.setDate(today.getDate() + 2);
    const day5 = new Date(today);
    day5.setDate(today.getDate() + 5);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Item Day 2',
        quantity: '1.0',
        expiry_date: day2.toISOString().split('T')[0]
      },
      {
        name: 'Item Day 5',
        quantity: '2.0',
        expiry_date: day5.toISOString().split('T')[0]
      }
    ]).execute();

    // Test with 3 days ahead - should only return the item expiring on day 2
    const result = await getExpiringItems({ days_ahead: 3 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Item Day 2');
  });

  it('should include items expiring today', async () => {
    const today = new Date();
    
    await db.insert(pantryItemsTable).values([
      {
        name: 'Expiring Today',
        quantity: '1.5',
        expiry_date: today.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getExpiringItems(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Expiring Today');
    expect(result[0].quantity).toEqual(1.5);
  });

  it('should handle items with past expiry dates', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 6);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Expired Yesterday',
        quantity: '1.0',
        expiry_date: yesterday.toISOString().split('T')[0]
      },
      {
        name: 'Expiring Next Week',
        quantity: '2.0',
        expiry_date: nextWeek.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getExpiringItems(testInput);

    // Should include both expired items and future expiring items
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Expired Yesterday'); // Should come first (earliest date)
    expect(result[1].name).toEqual('Expiring Next Week');
  });
});
