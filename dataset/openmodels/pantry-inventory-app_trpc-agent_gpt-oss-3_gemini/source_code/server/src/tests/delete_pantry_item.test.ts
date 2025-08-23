import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type PantryItem } from '../schema';
import { deletePantryItem } from '../handlers/delete_pantry_item';

// Helper to insert a pantry item directly for testing
const insertTestItem = async () => {
  const now = new Date();
  const result = await db
    .insert(pantryItemsTable)
    .values({
      name: 'Test Milk',
      quantity: (2.5).toString(), // stored as string per numeric column handling
      unit: 'liters',
      expiry_date: now,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deletePantryItem handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing pantry item and return it with correct types', async () => {
    const inserted = await insertTestItem();

    const deleted = await deletePantryItem(inserted.id);

    // Verify returned fields match the inserted values (numeric conversion applied)
    expect(deleted.id).toBe(inserted.id);
    expect(deleted.name).toBe(inserted.name);
    expect(deleted.unit).toBe(inserted.unit);
    // Quantity should be a number, not a string
    expect(typeof deleted.quantity).toBe('number');
    expect(deleted.quantity).toBeCloseTo(parseFloat(inserted.quantity as any));
    expect(deleted.expiry_date).toStrictEqual(inserted.expiry_date);

    // Ensure the record is no longer in the database
    const rows = await db
      .select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, inserted.id))
      .execute();
    expect(rows).toHaveLength(0);
  });

  it('should throw an error when attempting to delete a non‑existent item', async () => {
    await expect(deletePantryItem(9999)).rejects.toThrow(/not found/i);
  });
});
