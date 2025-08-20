import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

describe('updatePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testItemId: number;

  beforeEach(async () => {
    // Create a test item for updating
    const result = await db.insert(pantryItemsTable)
      .values({
        name: 'Original Item',
        quantity: '10.5',
        unit: 'lbs',
        expiration_date: '2024-12-31', // Use string format for date insertion
        category: 'vegetables',
        notes: 'Original notes'
      })
      .returning()
      .execute();
    
    testItemId = result[0].id;
  });

  it('should update all fields of a pantry item', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      name: 'Updated Item Name',
      quantity: 25.75,
      unit: 'oz',
      expiration_date: new Date('2025-01-15'),
      category: 'dairy',
      notes: 'Updated notes'
    };

    const result = await updatePantryItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testItemId);
    expect(result.name).toEqual('Updated Item Name');
    expect(result.quantity).toEqual(25.75);
    expect(typeof result.quantity).toEqual('number');
    expect(result.unit).toEqual('oz');
    expect(result.expiration_date).toEqual(new Date('2025-01-15'));
    expect(result.category).toEqual('dairy');
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update partial fields only', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      name: 'Partially Updated',
      quantity: 15.0
    };

    const result = await updatePantryItem(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated');
    expect(result.quantity).toEqual(15.0);
    
    // Verify unchanged fields
    expect(result.unit).toEqual('lbs');
    expect(result.category).toEqual('vegetables');
    expect(result.notes).toEqual('Original notes');
    expect(result.expiration_date).toEqual(new Date('2024-12-31'));
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      category: null,
      notes: null
    };

    const result = await updatePantryItem(updateInput);

    // Verify nullable fields are set to null
    expect(result.category).toBeNull();
    expect(result.notes).toBeNull();
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Item');
    expect(result.quantity).toEqual(10.5);
    expect(result.unit).toEqual('lbs');
  });

  it('should save updated item to database correctly', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      name: 'Database Test Item',
      quantity: 33.33,
      category: 'meat'
    };

    await updatePantryItem(updateInput);

    // Query database directly to verify update
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItemId))
      .execute();

    expect(items).toHaveLength(1);
    const dbItem = items[0];
    expect(dbItem.name).toEqual('Database Test Item');
    expect(parseFloat(dbItem.quantity)).toEqual(33.33);
    expect(dbItem.category).toEqual('meat');
    expect(dbItem.unit).toEqual('lbs'); // Unchanged field
    expect(dbItem.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalItem = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItemId))
      .execute();

    const originalUpdatedAt = originalItem[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      name: 'Timestamp Test'
    };

    const result = await updatePantryItem(updateInput);

    // Verify updated_at changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Item'
    };

    expect(async () => {
      await updatePantryItem(updateInput);
    }).toThrow(/not found/i);
  });

  it('should handle decimal quantities correctly', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      quantity: 12.75 // Use a decimal that won't have precision issues
    };

    const result = await updatePantryItem(updateInput);

    expect(result.quantity).toEqual(12.75);
    expect(typeof result.quantity).toEqual('number');

    // Verify in database
    const dbItem = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItemId))
      .execute();

    expect(parseFloat(dbItem[0].quantity)).toEqual(12.75);
  });

  it('should handle date updates correctly', async () => {
    const newExpirationDate = new Date('2025-06-15');
    const updateInput: UpdatePantryItemInput = {
      id: testItemId,
      expiration_date: newExpirationDate
    };

    const result = await updatePantryItem(updateInput);

    expect(result.expiration_date).toEqual(newExpirationDate);
    expect(result.expiration_date).toBeInstanceOf(Date);

    // Verify in database
    const dbItem = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, testItemId))
      .execute();

    expect(new Date(dbItem[0].expiration_date)).toEqual(newExpirationDate);
  });
});
