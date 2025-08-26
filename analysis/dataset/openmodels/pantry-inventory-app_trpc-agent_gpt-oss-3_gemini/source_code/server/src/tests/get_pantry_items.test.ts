import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { getPantryItems } from '../handlers/get_pantry_items';


describe('getPantryItems handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all pantry items with correct types', async () => {
    // Insert a pantry item directly
    const insertResult = await db
      .insert(pantryItemsTable)
      .values({
        name: 'Tomatoes',
        quantity: '5.5', // numeric column expects string, but drizzle will handle conversion
        unit: 'pieces',
        expiry_date: new Date('2025-01-01')
      })
      .returning()
      .execute();

    const inserted = insertResult[0];

    const items = await getPantryItems();
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.id).toBe(inserted.id);
    expect(item.name).toBe('Tomatoes');
    expect(item.quantity).toBe(5.5);
    expect(typeof item.quantity).toBe('number');
    expect(item.unit).toBe('pieces');
    expect(item.expiry_date).toBeInstanceOf(Date);
    expect(item.created_at).toBeInstanceOf(Date);
  });

  it('should return all inserted pantry items', async () => {
    // Insert two items with different expiry dates
    await db.insert(pantryItemsTable).values({
      name: 'Milk',
      quantity: '2',
      unit: 'liters',
      expiry_date: new Date('2024-06-01')
    }).execute();
    await db.insert(pantryItemsTable).values({
      name: 'Cheese',
      quantity: '1',
      unit: 'grams',
      expiry_date: new Date('2024-12-01')
    }).execute();

    const allItems = await getPantryItems();
    expect(allItems).toHaveLength(2);
    const names = allItems.map(i => i.name);
    expect(names).toContain('Milk');
    expect(names).toContain('Cheese');
  });
});
