import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreatePantryItemInput = {
  name: 'Test Pantry Item',
  quantity: 5,
  expiry_date: new Date('2024-12-31'),
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Pantry Item');
    expect(result.quantity).toEqual(5);
    expect(result.expiry_date).toEqual(new Date('2024-12-31'));
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
    expect(pantryItems[0].name).toEqual('Test Pantry Item');
    expect(pantryItems[0].quantity).toEqual(5);
    // When comparing dates from database, we need to handle the string format
    expect(pantryItems[0].expiry_date).toEqual('2024-12-31');
    expect(pantryItems[0].created_at).toBeInstanceOf(Date);
    expect(pantryItems[0].updated_at).toBeInstanceOf(Date);
  });
});
