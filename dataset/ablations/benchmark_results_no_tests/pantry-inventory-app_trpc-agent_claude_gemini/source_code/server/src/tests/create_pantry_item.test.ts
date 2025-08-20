import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq, gte, between, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePantryItemInput = {
  name: 'Test Apples',
  quantity: 5.5,
  expiry_date: new Date('2024-12-31')
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Apples');
    expect(result.quantity).toEqual(5.5);
    expect(typeof result.quantity).toBe('number');
    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.expiry_date.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pantry item to database', async () => {
    const result = await createPantryItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Test Apples');
    expect(items[0].quantity).toEqual(5.5);
    expect(typeof items[0].quantity).toBe('number');
    expect(items[0].expiry_date).toEqual('2024-12-31'); // Date column stores as string
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different quantity types correctly', async () => {
    // Test with integer quantity
    const integerInput: CreatePantryItemInput = {
      name: 'Whole Bananas',
      quantity: 12,
      expiry_date: new Date('2024-11-15')
    };

    const result = await createPantryItem(integerInput);
    expect(result.quantity).toEqual(12);
    expect(typeof result.quantity).toBe('number');

    // Test with decimal quantity
    const decimalInput: CreatePantryItemInput = {
      name: 'Flour',
      quantity: 2.75,
      expiry_date: new Date('2025-06-30')
    };

    const result2 = await createPantryItem(decimalInput);
    expect(result2.quantity).toEqual(2.75);
    expect(typeof result2.quantity).toBe('number');
  });

  it('should handle various date formats correctly', async () => {
    // Test with different date input
    const dateInput: CreatePantryItemInput = {
      name: 'Milk',
      quantity: 1,
      expiry_date: new Date('2024-01-05T10:30:00Z') // Will be stored as date only
    };

    const result = await createPantryItem(dateInput);
    
    // Should store only the date part
    expect(result.expiry_date.toISOString().split('T')[0]).toEqual('2024-01-05');
    expect(result.expiry_date).toBeInstanceOf(Date);
  });

  it('should query items by date range correctly', async () => {
    // Create test items with different expiry dates
    await createPantryItem({
      name: 'Item 1',
      quantity: 1,
      expiry_date: new Date('2024-12-01')
    });

    await createPantryItem({
      name: 'Item 2', 
      quantity: 2,
      expiry_date: new Date('2024-12-15')
    });

    await createPantryItem({
      name: 'Item 3',
      quantity: 3,
      expiry_date: new Date('2024-12-31')
    });

    // Test date filtering - query items expiring in December 2024
    const startDateStr = '2024-12-01';
    const endDateStr = '2024-12-31';

    const items = await db.select()
      .from(pantryItemsTable)
      .where(
        and(
          gte(pantryItemsTable.expiry_date, startDateStr),
          between(pantryItemsTable.expiry_date, startDateStr, endDateStr)
        )
      )
      .execute();

    expect(items.length).toEqual(3);
    items.forEach(item => {
      expect(item.expiry_date >= '2024-12-01').toBe(true);
      expect(item.expiry_date <= '2024-12-31').toBe(true);
    });
  });

  it('should create multiple items with unique IDs', async () => {
    const item1 = await createPantryItem({
      name: 'Item 1',
      quantity: 1,
      expiry_date: new Date('2024-12-01')
    });

    const item2 = await createPantryItem({
      name: 'Item 2',
      quantity: 2,
      expiry_date: new Date('2024-12-02')
    });

    // Each item should have unique ID
    expect(item1.id).not.toEqual(item2.id);
    expect(item1.id).toBeGreaterThan(0);
    expect(item2.id).toBeGreaterThan(0);

    // Both should exist in database
    const allItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(allItems).toHaveLength(2);
  });
});
