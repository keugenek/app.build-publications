import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreatePantryItemInput = {
  name: 'Test Milk',
  quantity: 2.5,
  unit: 'cups',
  expiration_date: new Date('2024-12-31'),
  category: 'dairy',
  notes: 'Organic whole milk'
};

// Minimal test input without optional fields
const minimalInput: CreatePantryItemInput = {
  name: 'Test Bread',
  quantity: 1,
  unit: 'loaf',
  expiration_date: new Date('2024-12-25')
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item with all fields', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Milk');
    expect(result.quantity).toEqual(2.5);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('cups');
    expect(result.expiration_date).toEqual(new Date('2024-12-31'));
    expect(result.expiration_date).toBeInstanceOf(Date);
    expect(result.category).toEqual('dairy');
    expect(result.notes).toEqual('Organic whole milk');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a pantry item with minimal fields', async () => {
    const result = await createPantryItem(minimalInput);

    expect(result.name).toEqual('Test Bread');
    expect(result.quantity).toEqual(1);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('loaf');
    expect(result.expiration_date).toEqual(new Date('2024-12-25'));
    expect(result.category).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pantry item to database', async () => {
    const result = await createPantryItem(testInput);

    // Query using proper drizzle syntax
    const pantryItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(pantryItems).toHaveLength(1);
    const dbItem = pantryItems[0];
    
    expect(dbItem.name).toEqual('Test Milk');
    expect(parseFloat(dbItem.quantity)).toEqual(2.5);
    expect(dbItem.unit).toEqual('cups');
    expect(new Date(dbItem.expiration_date)).toEqual(new Date('2024-12-31'));
    expect(dbItem.category).toEqual('dairy');
    expect(dbItem.notes).toEqual('Organic whole milk');
    expect(dbItem.created_at).toBeInstanceOf(Date);
    expect(dbItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal quantities correctly', async () => {
    const decimalInput: CreatePantryItemInput = {
      name: 'Test Sugar',
      quantity: 0.75,
      unit: 'kg',
      expiration_date: new Date('2025-01-15')
    };

    const result = await createPantryItem(decimalInput);

    expect(result.quantity).toEqual(0.75);
    expect(typeof result.quantity).toBe('number');

    // Verify in database
    const dbItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(parseFloat(dbItems[0].quantity)).toEqual(0.75);
  });

  it('should handle various expiration dates correctly', async () => {
    const futureDate = new Date('2025-06-15');
    const dateInput: CreatePantryItemInput = {
      name: 'Test Item',
      quantity: 1,
      unit: 'piece',
      expiration_date: futureDate
    };

    const result = await createPantryItem(dateInput);

    expect(result.expiration_date).toEqual(futureDate);
    expect(result.expiration_date).toBeInstanceOf(Date);

    // Verify date is stored correctly in database
    const dbItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(new Date(dbItems[0].expiration_date)).toEqual(futureDate);
  });

  it('should handle different units and categories', async () => {
    const testCases = [
      { unit: 'pieces', category: 'vegetables' },
      { unit: 'lbs', category: 'meat' },
      { unit: 'oz', category: 'spices' },
      { unit: 'bottles', category: null }
    ];

    for (const testCase of testCases) {
      const input: CreatePantryItemInput = {
        name: `Test ${testCase.unit}`,
        quantity: 3,
        unit: testCase.unit,
        expiration_date: new Date('2024-12-20'),
        category: testCase.category
      };

      const result = await createPantryItem(input);

      expect(result.unit).toEqual(testCase.unit);
      expect(result.category).toEqual(testCase.category);
    }
  });

  it('should create multiple items without conflict', async () => {
    const item1: CreatePantryItemInput = {
      name: 'Item 1',
      quantity: 1,
      unit: 'piece',
      expiration_date: new Date('2024-12-20')
    };

    const item2: CreatePantryItemInput = {
      name: 'Item 2',
      quantity: 2,
      unit: 'cups',
      expiration_date: new Date('2024-12-21')
    };

    const result1 = await createPantryItem(item1);
    const result2 = await createPantryItem(item2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Item 1');
    expect(result2.name).toEqual('Item 2');

    // Verify both items exist in database
    const allItems = await db.select()
      .from(pantryItemsTable)
      .execute();

    expect(allItems).toHaveLength(2);
  });
});
