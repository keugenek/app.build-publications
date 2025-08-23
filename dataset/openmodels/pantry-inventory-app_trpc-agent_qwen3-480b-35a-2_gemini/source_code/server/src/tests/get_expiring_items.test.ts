import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getExpiringItems } from '../handlers/get_expiring_items';

describe('getExpiringItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items expiring within 7 days by default', async () => {
    const today = new Date();
    
    // Create items with different expiry dates
    const expiringItem = {
      name: 'Expiring Item',
      quantity: 2,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString().split('T')[0], // 3 days from now
    };

    const nonExpiringItem = {
      name: 'Non-Expiring Item',
      quantity: 1,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0], // 10 days from now
    };

    const expiredItem = {
      name: 'Expired Item',
      quantity: 1,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0], // Yesterday
    };

    // Insert test data
    await db.insert(pantryItemsTable).values(expiringItem).execute();
    await db.insert(pantryItemsTable).values(nonExpiringItem).execute();
    await db.insert(pantryItemsTable).values(expiredItem).execute();

    const results = await getExpiringItems();

    // Should only return the item expiring within 7 days
    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual(expiringItem.name);
    expect(results[0].quantity).toEqual(expiringItem.quantity);
    expect(results[0].expiry_date).toBeInstanceOf(Date);
  });

  it('should return items expiring within specified days', async () => {
    const today = new Date();
    
    // Create items with different expiry dates (formatted as strings for database)
    const itemIn3Days = {
      name: 'Item in 3 days',
      quantity: 1,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString().split('T')[0],
    };

    const itemIn5Days = {
      name: 'Item in 5 days',
      quantity: 2,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().split('T')[0],
    };

    const itemIn10Days = {
      name: 'Item in 10 days',
      quantity: 3,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0],
    };

    // Insert test data
    await db.insert(pantryItemsTable).values(itemIn3Days).execute();
    await db.insert(pantryItemsTable).values(itemIn5Days).execute();
    await db.insert(pantryItemsTable).values(itemIn10Days).execute();

    // Test with 6 days threshold
    const results = await getExpiringItems(6);

    // Should return items expiring in 3 and 5 days
    expect(results).toHaveLength(2);
    
    const sortedResults = results.sort((a, b) => 
      a.expiry_date.getTime() - b.expiry_date.getTime()
    );
    
    expect(sortedResults[0].name).toEqual(itemIn3Days.name);
    expect(sortedResults[1].name).toEqual(itemIn5Days.name);
  });

  it('should return empty array when no items are expiring', async () => {
    const today = new Date();
    
    // Create an item that expires far in the future
    const futureItem = {
      name: 'Future Item',
      quantity: 1,
      expiry_date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0], // 1 year from now
    };

    await db.insert(pantryItemsTable).values(futureItem).execute();

    const results = await getExpiringItems(5); // Check next 5 days
    
    expect(results).toHaveLength(0);
  });

  it('should return items ordered by expiry date', async () => {
    const today = new Date();
    
    // Create items with different expiry dates (formatted as strings)
    const itemIn5Days = {
      name: 'Item in 5 days',
      quantity: 1,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().split('T')[0],
    };

    const itemIn2Days = {
      name: 'Item in 2 days',
      quantity: 2,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString().split('T')[0],
    };

    const itemIn7Days = {
      name: 'Item in 7 days',
      quantity: 3,
      expiry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().split('T')[0],
    };

    // Insert test data in random order
    await db.insert(pantryItemsTable).values(itemIn5Days).execute();
    await db.insert(pantryItemsTable).values(itemIn7Days).execute();
    await db.insert(pantryItemsTable).values(itemIn2Days).execute();

    const results = await getExpiringItems(10); // Check next 10 days
    
    // Should be ordered by expiry date (ascending)
    expect(results).toHaveLength(3);
    expect(results[0].name).toEqual(itemIn2Days.name);
    expect(results[1].name).toEqual(itemIn5Days.name);
    expect(results[2].name).toEqual(itemIn7Days.name);
  });
});
