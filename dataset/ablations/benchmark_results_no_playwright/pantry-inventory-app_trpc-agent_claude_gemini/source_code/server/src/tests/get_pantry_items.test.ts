import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getPantryItems } from '../handlers/get_pantry_items';

describe('getPantryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getPantryItems();
    expect(result).toEqual([]);
  });

  it('should fetch all pantry items with computed expiry fields', async () => {
    // Create test items with different expiry scenarios
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Insert test items
    await db.insert(pantryItemsTable).values([
      {
        name: 'Fresh Milk',
        quantity: '2.5',
        unit: 'liters',
        expiry_date: tomorrow
      },
      {
        name: 'Expired Bread',
        quantity: '1',
        unit: 'loaf',
        expiry_date: yesterday
      },
      {
        name: 'Canned Beans',
        quantity: '3',
        unit: 'cans',
        expiry_date: nextWeek
      }
    ]).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(3);
    
    // Check first item (should be sorted by expiry date - earliest first)
    const expiredItem = result.find(item => item.name === 'Expired Bread');
    expect(expiredItem).toBeDefined();
    expect(expiredItem!.name).toBe('Expired Bread');
    expect(typeof expiredItem!.quantity).toBe('number');
    expect(expiredItem!.quantity).toBe(1);
    expect(expiredItem!.unit).toBe('loaf');
    expect(expiredItem!.is_expired).toBe(true);
    expect(expiredItem!.days_until_expiry).toBeLessThan(0);
    expect(expiredItem!.id).toBeDefined();
    expect(expiredItem!.added_date).toBeInstanceOf(Date);
    expect(expiredItem!.expiry_date).toBeInstanceOf(Date);

    // Check fresh item
    const freshItem = result.find(item => item.name === 'Fresh Milk');
    expect(freshItem).toBeDefined();
    expect(freshItem!.quantity).toBe(2.5);
    expect(freshItem!.is_expired).toBe(false);
    expect(freshItem!.days_until_expiry).toBe(1);

    // Check future item
    const futureItem = result.find(item => item.name === 'Canned Beans');
    expect(futureItem).toBeDefined();
    expect(futureItem!.is_expired).toBe(false);
    expect(futureItem!.days_until_expiry).toBe(7);
  });

  it('should sort items by expiry date (earliest first)', async () => {
    const baseDate = new Date();
    
    // Create items with different expiry dates
    const dates = [
      new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
      new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    ];

    await db.insert(pantryItemsTable).values([
      {
        name: 'Item Future',
        quantity: '1',
        unit: 'piece',
        expiry_date: dates[0]
      },
      {
        name: 'Item Expired',
        quantity: '1',
        unit: 'piece',
        expiry_date: dates[1]
      },
      {
        name: 'Item Soon',
        quantity: '1',
        unit: 'piece',
        expiry_date: dates[2]
      }
    ]).execute();

    const result = await getPantryItems();

    // Should be sorted by expiry date: expired (-1), soon (2), future (5)
    expect(result[0].name).toBe('Item Expired');
    expect(result[0].days_until_expiry).toBe(-1);
    expect(result[1].name).toBe('Item Soon');
    expect(result[1].days_until_expiry).toBe(2);
    expect(result[2].name).toBe('Item Future');
    expect(result[2].days_until_expiry).toBe(5);
  });

  it('should handle decimal quantities correctly', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(pantryItemsTable).values({
      name: 'Olive Oil',
      quantity: '0.75', // Decimal quantity stored as string
      unit: 'liters',
      expiry_date: tomorrow
    }).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(1);
    expect(typeof result[0].quantity).toBe('number');
    expect(result[0].quantity).toBe(0.75);
  });

  it('should compute expiry status correctly for edge cases', async () => {
    const today = new Date();
    
    // Create item expiring today (should be considered not expired but 0 days until expiry)
    await db.insert(pantryItemsTable).values({
      name: 'Expires Today',
      quantity: '1',
      unit: 'item',
      expiry_date: today
    }).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(1);
    expect(result[0].is_expired).toBe(false);
    expect(result[0].days_until_expiry).toBe(0);
  });

  it('should handle items with same expiry date consistently', async () => {
    const sameDate = new Date();
    sameDate.setDate(sameDate.getDate() + 3);

    await db.insert(pantryItemsTable).values([
      {
        name: 'Item A',
        quantity: '1',
        unit: 'piece',
        expiry_date: sameDate
      },
      {
        name: 'Item B',
        quantity: '2',
        unit: 'pieces',
        expiry_date: sameDate
      }
    ]).execute();

    const result = await getPantryItems();

    expect(result).toHaveLength(2);
    // Both should have same days_until_expiry
    expect(result[0].days_until_expiry).toBe(3);
    expect(result[1].days_until_expiry).toBe(3);
    expect(result[0].is_expired).toBe(false);
    expect(result[1].is_expired).toBe(false);
  });
});
