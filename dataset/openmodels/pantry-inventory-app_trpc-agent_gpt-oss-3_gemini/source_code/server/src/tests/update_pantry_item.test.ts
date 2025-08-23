import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { type CreatePantryItemInput, type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';

// Helper to insert a pantry item for testing
const insertPantryItem = async (input: CreatePantryItemInput) => {
  const result = await db
    .insert(pantryItemsTable)
    .values({
      name: input.name,
      quantity: input.quantity.toString(), // numeric stored as string
      unit: input.unit,
      expiry_date: input.expiry_date,
    })
    .returning()
    .execute();
  return result[0];
};

describe('updatePantryItem handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update provided fields and keep others unchanged', async () => {
    // Insert initial item
    const original = await insertPantryItem({
      name: 'Flour',
      quantity: 5,
      unit: 'grams',
      expiry_date: new Date('2025-01-01'),
    });

    const updateInput: UpdatePantryItemInput = {
      id: original.id,
      name: 'Whole Wheat Flour',
      quantity: 10, // change numeric
    };

    const updated = await updatePantryItem(updateInput);

    // Verify returned object
    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Whole Wheat Flour');
    expect(updated.quantity).toBe(10);
    // unchanged fields should retain original values
    expect(updated.unit).toBe(original.unit);
    expect(updated.expiry_date.getTime()).toBe(original.expiry_date.getTime());

    // Verify DB state matches
    const dbItem = await db
      .select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, original.id))
      .execute();
    const row = dbItem[0];
    expect(row.name).toBe('Whole Wheat Flour');
    expect(parseFloat(row.quantity as any)).toBe(10);
    expect(row.unit).toBe('grams');
  });

  it('should handle updating only numeric field', async () => {
    const original = await insertPantryItem({
      name: 'Sugar',
      quantity: 2,
      unit: 'grams',
      expiry_date: new Date('2024-12-31'),
    });

    const updateInput: UpdatePantryItemInput = {
      id: original.id,
      quantity: 3.5,
    };

    const updated = await updatePantryItem(updateInput);
    expect(updated.quantity).toBe(3.5);
    // other fields unchanged
    expect(updated.name).toBe('Sugar');
    expect(updated.unit).toBe('grams');
  });
});
