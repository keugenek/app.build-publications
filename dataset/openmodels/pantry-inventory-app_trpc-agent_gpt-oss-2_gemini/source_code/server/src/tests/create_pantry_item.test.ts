import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreatePantryItemInput = {
  name: 'Canned Beans',
  quantity: 12,
  expiry_date: new Date('2030-01-01'),
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item', async () => {
    const result = await createPantryItem(testInput);

    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.quantity).toBe(testInput.quantity);
    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.expiry_date.getTime()).toBe(testInput.expiry_date.getTime());
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the pantry item in the database', async () => {
    const created = await createPantryItem(testInput);

    const rows = await db
      .select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const stored = rows[0];
    expect(stored.name).toBe(testInput.name);
    expect(stored.quantity).toBe(testInput.quantity);
    expect(stored.expiry_date).toBeInstanceOf(Date);
    expect(stored.expiry_date.getTime()).toBe(testInput.expiry_date.getTime());
    expect(stored.created_at).toBeInstanceOf(Date);
  });
});
