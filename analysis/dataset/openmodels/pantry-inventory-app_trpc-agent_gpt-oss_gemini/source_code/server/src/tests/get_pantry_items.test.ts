import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem, type CreatePantryItemInput } from '../schema';
import { getPantryItems } from '../handlers/get_pantry_items';
// import { eq } from 'drizzle-orm';

// Sample input
const sampleInput: CreatePantryItemInput = {
  name: 'Tomatoes',
  quantity: 5,
  unit: 'pcs',
  purchase_date: new Date('2025-08-01'),
  expiry_date: new Date('2025-08-15'),
  category: 'Produce',
};

describe('getPantryItems handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const items = await getPantryItems();
    expect(Array.isArray(items)).toBeTrue();
    expect(items).toHaveLength(0);
  });

  it('should fetch all pantry items with correct types', async () => {
    // Insert a pantry item directly via DB
    const inserted = await db
      .insert(pantryItemsTable)
      .values({
        name: sampleInput.name,
        quantity: sampleInput.quantity.toString(), // numeric stored as string
        unit: sampleInput.unit,
        purchase_date: sampleInput.purchase_date.toISOString().split('T')[0],
        expiry_date: sampleInput.expiry_date.toISOString().split('T')[0],
        category: sampleInput.category,
      })
      .returning()
      .execute();

    // Ensure insertion succeeded
    expect(inserted).toHaveLength(1);
    const insertedItem = inserted[0];
    expect(parseFloat(insertedItem.quantity as unknown as string)).toBe(5);

    // Use handler to fetch items
    const items = await getPantryItems();
    expect(Array.isArray(items)).toBeTrue();
    expect(items).toHaveLength(1);

    const fetched = items[0];
    // Verify fields match inserted data
    expect(fetched.name).toBe(sampleInput.name);
    expect(fetched.quantity).toBe(sampleInput.quantity);
    expect(fetched.unit).toBe(sampleInput.unit);
    expect(fetched.category).toBe(sampleInput.category);
    // Dates should be Date instances
    expect(fetched.purchase_date).toBeInstanceOf(Date);
    expect(fetched.expiry_date).toBeInstanceOf(Date);
    expect(fetched.created_at).toBeInstanceOf(Date);
    // Ensure numeric conversion occurred
    expect(typeof fetched.quantity).toBe('number');
    expect(fetched.quantity).toBe(sampleInput.quantity);
  });
});
