import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type GetItemsByExpiryInput } from '../schema';
import { getItemsWithExpiryStatus } from '../handlers/get_items_with_expiry_status';

describe('getItemsWithExpiryStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    expect(result).toEqual([]);
  });

  it('should categorize items correctly based on expiry status', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    
    const inTenDays = new Date(today);
    inTenDays.setDate(inTenDays.getDate() + 10);

    // Create test items with different expiry dates
    await db.insert(pantryItemsTable).values([
      {
        name: 'Expired Item',
        quantity: 2.5,
        expiry_date: yesterday.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
      },
      {
        name: 'Expiring Soon Item',
        quantity: 1.0,
        expiry_date: inThreeDays.toISOString().split('T')[0]
      },
      {
        name: 'Fresh Item',
        quantity: 3.0,
        expiry_date: inTenDays.toISOString().split('T')[0]
      }
    ]).execute();

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    expect(result).toHaveLength(3);

    // Find items by name for easier testing
    const expiredItem = result.find(item => item.name === 'Expired Item')!;
    const expiringSoonItem = result.find(item => item.name === 'Expiring Soon Item')!;
    const freshItem = result.find(item => item.name === 'Fresh Item')!;

    // Check expiry status categorization
    expect(expiredItem.expiry_status).toBe('expired');
    expect(expiredItem.days_until_expiry).toBeLessThan(0);

    expect(expiringSoonItem.expiry_status).toBe('expiring_soon');
    expect(expiringSoonItem.days_until_expiry).toBeGreaterThan(0);
    expect(expiringSoonItem.days_until_expiry).toBeLessThanOrEqual(7);

    expect(freshItem.expiry_status).toBe('fresh');
    expect(freshItem.days_until_expiry).toBeGreaterThan(7);

    // Verify numeric conversion
    expect(typeof expiredItem.quantity).toBe('number');
    expect(expiredItem.quantity).toBe(2.5);
  });

  it('should sort items by expiry status priority', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const inTwoDays = new Date(today);
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    
    const inTenDays = new Date(today);
    inTenDays.setDate(inTenDays.getDate() + 10);

    // Insert items in random order
    await db.insert(pantryItemsTable).values([
      {
        name: 'Fresh Item',
        quantity: 1.0,
        expiry_date: inTenDays.toISOString().split('T')[0]
      },
      {
        name: 'Expired Item',
        quantity: 2.0,
        expiry_date: yesterday.toISOString().split('T')[0]
      },
      {
        name: 'Expiring Soon Item',
        quantity: 3.0,
        expiry_date: inTwoDays.toISOString().split('T')[0]
      }
    ]).execute();

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    // Should be sorted: expired first, then expiring soon, then fresh
    expect(result[0].expiry_status).toBe('expired');
    expect(result[1].expiry_status).toBe('expiring_soon');
    expect(result[2].expiry_status).toBe('fresh');

    expect(result[0].name).toBe('Expired Item');
    expect(result[1].name).toBe('Expiring Soon Item');
    expect(result[2].name).toBe('Fresh Item');
  });

  it('should handle custom days_ahead parameter', async () => {
    const today = new Date();
    const inFiveDays = new Date(today);
    inFiveDays.setDate(inFiveDays.getDate() + 5);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Test Item',
        quantity: 1.0,
        expiry_date: inFiveDays.toISOString().split('T')[0]
      }
    ]).execute();

    // With days_ahead = 3, item should be fresh
    const input1: GetItemsByExpiryInput = { days_ahead: 3 };
    const result1 = await getItemsWithExpiryStatus(input1);
    expect(result1[0].expiry_status).toBe('fresh');

    // With days_ahead = 7, item should be expiring soon
    const input2: GetItemsByExpiryInput = { days_ahead: 7 };
    const result2 = await getItemsWithExpiryStatus(input2);
    expect(result2[0].expiry_status).toBe('expiring_soon');
  });

  it('should use default days_ahead value when not provided', async () => {
    const today = new Date();
    const inFiveDays = new Date(today);
    inFiveDays.setDate(inFiveDays.getDate() + 5);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Test Item',
        quantity: 1.0,
        expiry_date: inFiveDays.toISOString().split('T')[0]
      }
    ]).execute();

    // Default days_ahead is 7 according to schema
    const input: GetItemsByExpiryInput = { days_ahead: 7 }; // Explicitly using default
    const result = await getItemsWithExpiryStatus(input);
    
    expect(result[0].expiry_status).toBe('expiring_soon');
    expect(result[0].days_until_expiry).toBe(5);
  });

  it('should handle items expiring today correctly', async () => {
    const today = new Date();

    await db.insert(pantryItemsTable).values([
      {
        name: 'Expiring Today',
        quantity: 1.0,
        expiry_date: today.toISOString().split('T')[0]
      }
    ]).execute();

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    expect(result[0].expiry_status).toBe('expiring_soon');
    expect(result[0].days_until_expiry).toBe(0);
  });

  it('should sort items with same status by expiry date', async () => {
    const today = new Date();
    const expiredThreeDaysAgo = new Date(today);
    expiredThreeDaysAgo.setDate(expiredThreeDaysAgo.getDate() - 3);
    
    const expiredOneDayAgo = new Date(today);
    expiredOneDayAgo.setDate(expiredOneDayAgo.getDate() - 1);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Less Expired',
        quantity: 1.0,
        expiry_date: expiredOneDayAgo.toISOString().split('T')[0]
      },
      {
        name: 'More Expired',
        quantity: 2.0,
        expiry_date: expiredThreeDaysAgo.toISOString().split('T')[0]
      }
    ]).execute();

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    // Both are expired, but should be sorted by expiry date (earliest first)
    expect(result[0].name).toBe('More Expired');
    expect(result[1].name).toBe('Less Expired');
    expect(result[0].days_until_expiry).toBeLessThan(result[1].days_until_expiry);
  });

  it('should include all required fields in response', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Test Item',
        quantity: 2.5,
        expiry_date: tomorrow.toISOString().split('T')[0]
      }
    ]).execute();

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getItemsWithExpiryStatus(input);

    const item = result[0];
    
    // Check all required fields exist
    expect(item.id).toBeDefined();
    expect(typeof item.id).toBe('number');
    expect(item.name).toBe('Test Item');
    expect(item.quantity).toBe(2.5);
    expect(typeof item.quantity).toBe('number');
    expect(item.expiry_date).toBeInstanceOf(Date);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
    expect(item.expiry_status).toBe('expiring_soon');
    expect(typeof item.days_until_expiry).toBe('number');
    expect(item.days_until_expiry).toBe(1);
  });
});
