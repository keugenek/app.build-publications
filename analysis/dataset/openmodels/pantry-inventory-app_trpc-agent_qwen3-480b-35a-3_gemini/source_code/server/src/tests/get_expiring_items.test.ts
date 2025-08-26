import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getExpiringItems } from '../handlers/get_expiring_items';
import { eq } from 'drizzle-orm';

describe('getExpiringItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getExpiringItems();
    expect(result).toEqual([]);
  });

  it('should return items expiring within 7 days', async () => {
    // Create test data with various expiry dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);
    
    const inSevenDays = new Date(today);
    inSevenDays.setDate(today.getDate() + 7);
    
    const inEightDays = new Date(today);
    inEightDays.setDate(today.getDate() + 8);
    
    // Format dates as strings for the database
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];
    const inSevenDaysStr = inSevenDays.toISOString().split('T')[0];
    const inEightDaysStr = inEightDays.toISOString().split('T')[0];
    
    // Insert test pantry items
    await db.insert(pantryItemsTable).values([
      {
        name: 'Milk',
        quantity: 2,
        expiry_date: tomorrowStr,
        category: 'Dairy',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bread',
        quantity: 1,
        expiry_date: inThreeDaysStr,
        category: 'Grains',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Canned beans',
        quantity: 5,
        expiry_date: inSevenDaysStr,
        category: 'Canned Goods',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Pasta',
        quantity: 3,
        expiry_date: inEightDaysStr,
        category: 'Grains',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]).execute();

    const result = await getExpiringItems();
    
    // Should only return 3 items (not the one expiring in 8 days)
    expect(result).toHaveLength(3);
    
    // Check that all returned items have correct structure
    result.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('expiry_date');
      expect(item).toHaveProperty('days_until_expiry');
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(item.expiry_date).toBeInstanceOf(Date);
      expect(typeof item.days_until_expiry).toBe('number');
    });
    
    // Check specific items
    const milkItem = result.find(item => item.name === 'Milk');
    expect(milkItem).toBeDefined();
    expect(milkItem!.days_until_expiry).toBe(1);
    
    const breadItem = result.find(item => item.name === 'Bread');
    expect(breadItem).toBeDefined();
    expect(breadItem!.days_until_expiry).toBe(3);
    
    const beansItem = result.find(item => item.name === 'Canned beans');
    expect(beansItem).toBeDefined();
    expect(beansItem!.days_until_expiry).toBe(7);
    
    // Pasta should not be in the results
    const pastaItem = result.find(item => item.name === 'Pasta');
    expect(pastaItem).toBeUndefined();
  });

  it('should return items ordered by expiry date', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);
    
    const inFiveDays = new Date(today);
    inFiveDays.setDate(today.getDate() + 5);
    
    // Format dates as strings for the database
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];
    const inFiveDaysStr = inFiveDays.toISOString().split('T')[0];
    
    // Insert test pantry items
    await db.insert(pantryItemsTable).values([
      {
        name: 'Item expiring last',
        quantity: 1,
        expiry_date: inFiveDaysStr,
        category: 'Other',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Item expiring first',
        quantity: 1,
        expiry_date: tomorrowStr,
        category: 'Dairy',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Item expiring middle',
        quantity: 1,
        expiry_date: inThreeDaysStr,
        category: 'Produce',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]).execute();

    const result = await getExpiringItems();
    
    // Check that results are ordered by expiry date (ascending)
    expect(result[0].name).toBe('Item expiring first');
    expect(result[1].name).toBe('Item expiring middle');
    expect(result[2].name).toBe('Item expiring last');
    
    // Also verify the days until expiry values
    expect(result[0].days_until_expiry).toBe(1);
    expect(result[1].days_until_expiry).toBe(3);
    expect(result[2].days_until_expiry).toBe(5);
  });
});
