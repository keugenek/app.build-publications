import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';
import { getPantryItems } from '../handlers/get_pantry_items';
import { eq } from 'drizzle-orm';

describe('getPantryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all pantry items from the database', async () => {
    // Insert test pantry items directly via db
    const expiry1 = new Date('2025-01-01');
    const expiry2 = new Date('2025-06-15');

    const inserted: PantryItem[] = (
      await db
        .insert(pantryItemsTable)
        .values([
          { name: 'Apples', quantity: 10, expiry_date: expiry1 },
          { name: 'Rice', quantity: 5, expiry_date: expiry2 },
        ])
        .returning()
        .execute()
    ).map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      expiry_date: item.expiry_date,
      created_at: item.created_at,
    }));

    // Call handler
    const result = await getPantryItems();

    // Verify count matches inserted items
    expect(result).toHaveLength(2);

    // Verify each inserted item exists in the result set
    for (const expected of inserted) {
      const found = result.find(r => r.id === expected.id);
      expect(found).toBeDefined();
      if (found) {
        expect(found.name).toBe(expected.name);
        expect(found.quantity).toBe(expected.quantity);
        expect(found.expiry_date.getTime()).toBe(expected.expiry_date.getTime());
        // created_at should be a Date instance
        expect(found.created_at).toBeInstanceOf(Date);
      }
    }
  });

  it('should return an empty array when no pantry items exist', async () => {
    const result = await getPantryItems();
    expect(result).toEqual([]);
  });
});
