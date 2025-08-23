import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';
import { eq } from 'drizzle-orm';

// Test input covering all fields
const testInput: CreatePantryItemInput = {
  name: 'Flour',
  quantity: 2.5,
  unit: 'grams',
  expiry_date: new Date('2099-12-31'),
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item and return correct data', async () => {
    const result = await createPantryItem(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.quantity).toBeCloseTo(testInput.quantity);
    expect(result.unit).toBe(testInput.unit);
    expect(result.expiry_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    // Ensure numeric conversion
    expect(typeof result.quantity).toBe('number');
  });

  it('should persist the pantry item in the database', async () => {
    const created = await createPantryItem(testInput);

    const rows = await db
      .select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    // Quantity stored as string in DB, convert for assertion
    expect(parseFloat(row.quantity as unknown as string)).toBeCloseTo(testInput.quantity);
    expect(row.unit).toBe(testInput.unit);
    expect(row.expiry_date).toBeInstanceOf(Date);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
