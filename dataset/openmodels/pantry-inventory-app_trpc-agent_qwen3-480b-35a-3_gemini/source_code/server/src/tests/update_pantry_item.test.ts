import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

// Test data
const updateInput: UpdatePantryItemInput = {
  id: 1,
  name: 'Almond Milk',
  quantity: 3,
  expiry_date: new Date('2024-01-15'),
  category: 'Beverages'
};

describe('updatePantryItem', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test item directly in the database
    await db.insert(pantryItemsTable)
      .values({
        id: 1,
        name: 'Milk',
        quantity: 2,
        expiry_date: '2023-12-31',
        category: 'Dairy',
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();
  });
  afterEach(resetDB);

  it('should update a pantry item with all fields', async () => {
    const result = await updatePantryItem(updateInput);

    // Validate the returned data
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Almond Milk');
    expect(result.quantity).toEqual(3);
    expect(result.expiry_date).toEqual(new Date('2024-01-15'));
    expect(result.category).toEqual('Beverages');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update a pantry item with partial fields', async () => {
    const partialUpdate: UpdatePantryItemInput = {
      id: 1,
      quantity: 5,
      expiry_date: new Date('2024-02-01')
    };

    const result = await updatePantryItem(partialUpdate);

    // Validate that provided fields were updated
    expect(result.id).toEqual(1);
    expect(result.quantity).toEqual(5);
    expect(result.expiry_date).toEqual(new Date('2024-02-01'));
    
    // Validate that non-provided fields remain unchanged
    expect(result.name).toEqual('Milk');
    expect(result.category).toEqual('Dairy');
    
    // Validate timestamps
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should save updated pantry item to database', async () => {
    await updatePantryItem(updateInput);

    // Query the database to verify the update was persisted
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, 1))
      .execute();

    expect(items).toHaveLength(1);
    const item = items[0];
    
    expect(item.name).toEqual('Almond Milk');
    expect(item.quantity).toEqual(3);
    expect(item.expiry_date).toEqual('2024-01-15');
    expect(item.category).toEqual('Beverages');
    expect(new Date(item.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(item.created_at).getTime());
  });

  it('should throw an error when trying to update a non-existent item', async () => {
    const invalidUpdate: UpdatePantryItemInput = {
      id: 999,
      name: 'Non-existent item'
    };

    await expect(updatePantryItem(invalidUpdate)).rejects.toThrow(/not found/i);
  });
});
