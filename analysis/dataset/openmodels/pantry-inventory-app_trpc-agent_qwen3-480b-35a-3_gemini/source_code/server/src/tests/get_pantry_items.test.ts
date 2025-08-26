import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput } from '../schema';
import { getPantryItems } from '../handlers/get_pantry_items';
import { eq } from 'drizzle-orm';

// Test inputs
const testItem1: CreatePantryItemInput = {
  name: 'Milk',
  quantity: 2,
  expiry_date: new Date('2023-12-31'),
  category: 'Dairy'
};

const testItem2: CreatePantryItemInput = {
  name: 'Bread',
  quantity: 1,
  expiry_date: new Date('2023-11-30'),
  category: 'Grains'
};

describe('getPantryItems', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(pantryItemsTable).values({
      ...testItem1,
      expiry_date: testItem1.expiry_date.toISOString().split('T')[0] // Convert to date string
    }).execute();
    
    await db.insert(pantryItemsTable).values({
      ...testItem2,
      expiry_date: testItem2.expiry_date.toISOString().split('T')[0] // Convert to date string
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all pantry items', async () => {
    const results = await getPantryItems();

    expect(results).toHaveLength(2);
    
    // Check first item
    const milkItem = results.find(item => item.name === 'Milk');
    expect(milkItem).toBeDefined();
    expect(milkItem!.quantity).toEqual(2);
    expect(milkItem!.category).toEqual('Dairy');
    expect(milkItem!.expiry_date).toBeInstanceOf(Date);
    expect(milkItem!.expiry_date.toISOString()).toContain('2023-12-31');
    expect(milkItem!.created_at).toBeInstanceOf(Date);
    expect(milkItem!.updated_at).toBeInstanceOf(Date);
    
    // Check second item
    const breadItem = results.find(item => item.name === 'Bread');
    expect(breadItem).toBeDefined();
    expect(breadItem!.quantity).toEqual(1);
    expect(breadItem!.category).toEqual('Grains');
    expect(breadItem!.expiry_date).toBeInstanceOf(Date);
    expect(breadItem!.expiry_date.toISOString()).toContain('2023-11-30');
    expect(breadItem!.created_at).toBeInstanceOf(Date);
    expect(breadItem!.updated_at).toBeInstanceOf(Date);
  });

  it('should return items ordered by name', async () => {
    const results = await getPantryItems();
    
    // Should be ordered alphabetically by name
    expect(results[0].name).toBe('Bread');
    expect(results[1].name).toBe('Milk');
  });

  it('should return empty array when no items exist', async () => {
    // Clear all items
    await db.delete(pantryItemsTable).execute();
    
    const results = await getPantryItems();
    expect(results).toHaveLength(0);
  });
});
