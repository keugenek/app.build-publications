import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type GetItemsByExpiryInput } from '../schema';
import { getExpiringSoonItems } from '../handlers/get_expiring_soon_items';

describe('getExpiringSoonItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestItem = async (name: string, daysFromNow: number) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    
    const result = await db.insert(pantryItemsTable)
      .values({
        name,
        quantity: 1.0,
        expiry_date: expiryDate.toISOString().split('T')[0]
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should return items expiring within default 7 days', async () => {
    // Create test items with different expiry dates
    await createTestItem('Expires Today', 0);
    await createTestItem('Expires Tomorrow', 1);
    await createTestItem('Expires in 5 days', 5);
    await createTestItem('Expires in 7 days', 7);
    await createTestItem('Expires in 10 days', 10); // Should not be included

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(4);
    expect(result.map(item => item.name)).toEqual([
      'Expires Today',
      'Expires Tomorrow', 
      'Expires in 5 days',
      'Expires in 7 days'
    ]);
  });

  it('should return items expiring within custom days_ahead', async () => {
    await createTestItem('Expires Tomorrow', 1);
    await createTestItem('Expires in 3 days', 3);
    await createTestItem('Expires in 5 days', 5);

    const input: GetItemsByExpiryInput = { days_ahead: 3 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name)).toEqual([
      'Expires Tomorrow',
      'Expires in 3 days'
    ]);
  });

  it('should sort items by expiry date (soonest first)', async () => {
    await createTestItem('Expires in 5 days', 5);
    await createTestItem('Expires Tomorrow', 1);
    await createTestItem('Expires in 3 days', 3);
    await createTestItem('Expires Today', 0);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result.map(item => item.name)).toEqual([
      'Expires Today',
      'Expires Tomorrow',
      'Expires in 3 days',
      'Expires in 5 days'
    ]);
  });

  it('should calculate days_until_expiry correctly', async () => {
    await createTestItem('Expires Today', 0);
    await createTestItem('Expires Tomorrow', 1);
    await createTestItem('Expires in 3 days', 3);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result[0].days_until_expiry).toEqual(0); // Today
    expect(result[1].days_until_expiry).toEqual(1); // Tomorrow
    expect(result[2].days_until_expiry).toEqual(3); // 3 days
  });

  it('should set expiry_status to expiring_soon for all items', async () => {
    await createTestItem('Test Item 1', 1);
    await createTestItem('Test Item 2', 5);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    result.forEach(item => {
      expect(item.expiry_status).toEqual('expiring_soon');
    });
  });

  it('should return all required fields with correct types', async () => {
    await createTestItem('Test Item', 2);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(1);
    const item = result[0];

    expect(item.id).toBeDefined();
    expect(typeof item.id).toBe('number');
    expect(item.name).toEqual('Test Item');
    expect(typeof item.name).toBe('string');
    expect(item.quantity).toEqual(1.0);
    expect(typeof item.quantity).toBe('number');
    expect(item.expiry_date).toBeInstanceOf(Date);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
    expect(item.expiry_status).toEqual('expiring_soon');
    expect(typeof item.days_until_expiry).toBe('number');
  });

  it('should return empty array when no items are expiring soon', async () => {
    // Create items that expire beyond the days_ahead range
    await createTestItem('Expires Far Future', 30);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(0);
  });

  it('should handle days_ahead of 0 (only items expiring today)', async () => {
    await createTestItem('Expires Today', 0);
    await createTestItem('Expires Tomorrow', 1);

    const input: GetItemsByExpiryInput = { days_ahead: 0 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Expires Today');
    expect(result[0].days_until_expiry).toEqual(0);
  });

  it('should exclude items that have already expired (negative days)', async () => {
    // Create an expired item
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    await db.insert(pantryItemsTable)
      .values({
        name: 'Already Expired',
        quantity: 1.0,
        expiry_date: expiredDate.toISOString().split('T')[0]
      })
      .execute();

    await createTestItem('Expires Tomorrow', 1);

    const input: GetItemsByExpiryInput = { days_ahead: 7 };
    const result = await getExpiringSoonItems(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Expires Tomorrow');
  });
});
