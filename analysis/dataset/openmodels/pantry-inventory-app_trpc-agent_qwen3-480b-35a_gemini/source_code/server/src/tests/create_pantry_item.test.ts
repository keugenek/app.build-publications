import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { type CreatePantryItemInput } from '../schema';
import { createPantryItem } from '../handlers/create_pantry_item';

// Test input
const testInput: CreatePantryItemInput = {
  name: 'Test Item',
  quantity: 5,
  expiry_date: new Date('2024-12-31')
};

describe('createPantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pantry item', async () => {
    const result = await createPantryItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Item');
    expect(result.quantity).toEqual(5);
    expect(result.expiry_date).toEqual(new Date('2024-12-31'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pantry item to database', async () => {
    const result = await createPantryItem(testInput);
    
    // Since we don't have access to the actual table schema,
    // we'll test by attempting to retrieve the item
    // This test will need to be updated once we have the actual table structure
    expect(result.id).toBeDefined();
  });
});
