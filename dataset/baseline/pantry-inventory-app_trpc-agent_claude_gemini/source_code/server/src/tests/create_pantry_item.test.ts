import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq, gte, lte, and } from 'drizzle-orm';

// Test input for creating a pantry item
const testInput: CreatePantryItemInput = {
  name: 'Test Apples',
  quantity: 5.5,
  expiry_date: new Date('2024-12-31')
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item with correct data types', async () => {
    const result = await createPantryItem(testInput);

    // Verify all fields and their types
    expect(result.name).toEqual('Test Apples');
    expect(result.quantity).toEqual(5.5);
    expect(typeof result.quantity).toBe('number');
    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.expiry_date).toEqual(new Date('2024-12-31'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pantry item to database correctly', async () => {
    const result = await createPantryItem(testInput);

    // Query the database directly to verify storage
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(pantryItems).toHaveLength(1);
    const savedItem = pantryItems[0];
    
    expect(savedItem.name).toEqual('Test Apples');
    expect(parseFloat(savedItem.quantity)).toEqual(5.5);
    expect(new Date(savedItem.expiry_date)).toEqual(new Date('2024-12-31'));
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different quantity values correctly', async () => {
    const integerQuantityInput: CreatePantryItemInput = {
      name: 'Test Bananas',
      quantity: 12,
      expiry_date: new Date('2024-11-15')
    };

    const result = await createPantryItem(integerQuantityInput);

    expect(result.quantity).toEqual(12);
    expect(typeof result.quantity).toBe('number');
  });

  it('should handle different date formats correctly', async () => {
    const futureDateInput: CreatePantryItemInput = {
      name: 'Test Milk',
      quantity: 1,
      expiry_date: new Date('2025-01-15')
    };

    const result = await createPantryItem(futureDateInput);

    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.expiry_date.getFullYear()).toEqual(2025);
    expect(result.expiry_date.getMonth()).toEqual(0); // January is month 0
    expect(result.expiry_date.getDate()).toEqual(15);
  });

  it('should query pantry items by date range correctly', async () => {
    // Create multiple pantry items with different expiry dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    await createPantryItem({
      name: 'Expiring Soon',
      quantity: 2,
      expiry_date: nextWeek
    });

    await createPantryItem({
      name: 'Expiring Later',
      quantity: 3,
      expiry_date: nextMonth
    });

    // Query for items expiring within the next 10 days
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() + 10);

    const expiringSoon = await db.select()
      .from(pantryItemsTable)
      .where(
        and(
          gte(pantryItemsTable.expiry_date, today.toISOString().split('T')[0]),
          lte(pantryItemsTable.expiry_date, cutoffDate.toISOString().split('T')[0])
        )
      )
      .execute();

    expect(expiringSoon.length).toBeGreaterThan(0);
    expiringSoon.forEach(item => {
      const expiryDate = new Date(item.expiry_date);
      expect(expiryDate >= today).toBe(true);
      expect(expiryDate <= cutoffDate).toBe(true);
    });
  });

  it('should create items with very small quantities', async () => {
    const smallQuantityInput: CreatePantryItemInput = {
      name: 'Test Spice',
      quantity: 0.1,
      expiry_date: new Date('2024-06-01')
    };

    const result = await createPantryItem(smallQuantityInput);

    expect(result.quantity).toEqual(0.1);
    expect(typeof result.quantity).toBe('number');

    // Verify precision is maintained in database
    const savedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(parseFloat(savedItems[0].quantity)).toEqual(0.1);
  });

  it('should handle items with past expiry dates', async () => {
    const pastDateInput: CreatePantryItemInput = {
      name: 'Expired Item',
      quantity: 1,
      expiry_date: new Date('2023-01-01')
    };

    const result = await createPantryItem(pastDateInput);

    expect(result.expiry_date).toEqual(new Date('2023-01-01'));
    expect(result.name).toEqual('Expired Item');
  });
});
