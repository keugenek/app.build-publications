import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type ExpiringItemsInput } from '../schema';
import { getExpiringItems } from '../handlers/get_expiring_items';

// Helper function to create test pantry items
const createTestItem = async (name: string, daysFromNow: number, category?: string) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + daysFromNow);

  return await db.insert(pantryItemsTable)
    .values({
      name,
      quantity: '1.5', // Using string for numeric column
      unit: 'lbs',
      expiration_date: expirationDate.toISOString().split('T')[0],
      category: category || 'vegetables',
      notes: 'Test item'
    })
    .returning()
    .execute();
};

describe('getExpiringItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items expiring within default 7 days', async () => {
    // Create items with different expiration dates
    await createTestItem('Expiring Today', 0);
    await createTestItem('Expiring Tomorrow', 1);
    await createTestItem('Expiring in 5 days', 5);
    await createTestItem('Expiring in 10 days', 10); // Should not be returned

    const input: ExpiringItemsInput = { days_ahead: 7 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(3);
    expect(results.map(item => item.name)).toContain('Expiring Today');
    expect(results.map(item => item.name)).toContain('Expiring Tomorrow');
    expect(results.map(item => item.name)).toContain('Expiring in 5 days');
    expect(results.map(item => item.name)).not.toContain('Expiring in 10 days');
  });

  it('should return items expiring within custom days ahead', async () => {
    // Create items with different expiration dates
    await createTestItem('Expiring Today', 0);
    await createTestItem('Expiring in 2 days', 2);
    await createTestItem('Expiring in 4 days', 4); // Should not be returned

    const input: ExpiringItemsInput = { days_ahead: 3 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(2);
    expect(results.map(item => item.name)).toContain('Expiring Today');
    expect(results.map(item => item.name)).toContain('Expiring in 2 days');
    expect(results.map(item => item.name)).not.toContain('Expiring in 4 days');
  });

  it('should order items by expiration date (earliest first)', async () => {
    // Create items in random order
    await createTestItem('Expiring in 5 days', 5);
    await createTestItem('Expiring Today', 0);
    await createTestItem('Expiring Tomorrow', 1);
    await createTestItem('Expiring in 3 days', 3);

    const input: ExpiringItemsInput = { days_ahead: 7 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(4);
    
    // Verify items are ordered by expiration date
    expect(results[0].name).toBe('Expiring Today');
    expect(results[1].name).toBe('Expiring Tomorrow');
    expect(results[2].name).toBe('Expiring in 3 days');
    expect(results[3].name).toBe('Expiring in 5 days');

    // Verify dates are in ascending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i].expiration_date >= results[i - 1].expiration_date).toBe(true);
    }
  });

  it('should return empty array when no items are expiring', async () => {
    // Create items that expire way in the future
    await createTestItem('Future Item 1', 30);
    await createTestItem('Future Item 2', 45);

    const input: ExpiringItemsInput = { days_ahead: 7 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(0);
  });

  it('should include items that have already expired', async () => {
    // Create items that expired in the past
    await createTestItem('Expired Yesterday', -1);
    await createTestItem('Expired 3 days ago', -3);
    await createTestItem('Expiring Tomorrow', 1);

    const input: ExpiringItemsInput = { days_ahead: 7 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(3);
    expect(results.map(item => item.name)).toContain('Expired Yesterday');
    expect(results.map(item => item.name)).toContain('Expired 3 days ago');
    expect(results.map(item => item.name)).toContain('Expiring Tomorrow');

    // Verify expired items come first in the sort order
    expect(results[0].name).toBe('Expired 3 days ago');
    expect(results[1].name).toBe('Expired Yesterday');
    expect(results[2].name).toBe('Expiring Tomorrow');
  });

  it('should convert numeric fields correctly', async () => {
    await createTestItem('Test Item', 3);

    const input: ExpiringItemsInput = { days_ahead: 7 };
    const results = await getExpiringItems(input);

    expect(results).toHaveLength(1);
    const item = results[0];

    // Verify numeric conversion
    expect(typeof item.quantity).toBe('number');
    expect(item.quantity).toBe(1.5);

    // Verify date conversion
    expect(item.expiration_date).toBeInstanceOf(Date);

    // Verify other fields are present
    expect(item.name).toBe('Test Item');
    expect(item.unit).toBe('lbs');
    expect(item.category).toBe('vegetables');
    expect(item.notes).toBe('Test item');
    expect(item.id).toBeDefined();
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });

  it('should handle edge case with days_ahead = 0', async () => {
    // Create items expiring today and tomorrow
    await createTestItem('Expiring Today', 0);
    await createTestItem('Expiring Tomorrow', 1);

    const input: ExpiringItemsInput = { days_ahead: 0 };
    const results = await getExpiringItems(input);

    // Should only return items expiring today or before
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Expiring Today');
  });
});
