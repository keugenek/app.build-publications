import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreatePantryItemInput = {
  name: 'Milk',
  quantity: 2,
  expiry_date: new Date('2023-12-31'),
  category: 'Dairy'
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Milk');
    expect(result.quantity).toEqual(2);
    expect(result.category).toEqual('Dairy');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Date comparison (accounting for potential timezone differences)
    const expectedDate = new Date('2023-12-31');
    expect(result.expiry_date.getFullYear()).toEqual(expectedDate.getFullYear());
    expect(result.expiry_date.getMonth()).toEqual(expectedDate.getMonth());
    expect(result.expiry_date.getDate()).toEqual(expectedDate.getDate());
  });

  it('should save pantry item to database', async () => {
    const result = await createPantryItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Milk');
    expect(items[0].quantity).toEqual(2);
    expect(items[0].category).toEqual('Dairy');
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
    
    // Date comparison
    const expectedDate = new Date('2023-12-31');
    const actualDate = new Date(items[0].expiry_date);
    expect(actualDate.getFullYear()).toEqual(expectedDate.getFullYear());
    expect(actualDate.getMonth()).toEqual(expectedDate.getMonth());
    expect(actualDate.getDate()).toEqual(expectedDate.getDate());
  });

  it('should handle different categories correctly', async () => {
    const testInputs = [
      { ...testInput, name: 'Apples', category: 'Produce' as const },
      { ...testInput, name: 'Beans', category: 'Canned Goods' as const },
      { ...testInput, name: 'Rice', category: 'Grains' as const }
    ];

    for (const input of testInputs) {
      const result = await createPantryItem(input);
      expect(result.category).toEqual(input.category);
    }
  });

  it('should handle zero quantity correctly', async () => {
    const inputWithZeroQuantity: CreatePantryItemInput = {
      ...testInput,
      name: 'Spices',
      quantity: 0,
      category: 'Condiments'
    };

    const result = await createPantryItem(inputWithZeroQuantity);
    expect(result.quantity).toEqual(0);
  });
});
