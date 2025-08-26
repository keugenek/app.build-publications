import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

// Helper function to create test pantry item directly in database
const createTestPantryItem = async () => {
  const result = await db.insert(pantryItemsTable)
    .values({
      name: 'Test Item',
      quantity: '5', // Store as string for numeric column
      unit: 'pieces',
      expiry_date: new Date('2024-12-31')
    })
    .returning()
    .execute();

  const item = result[0];
  return {
    ...item,
    quantity: parseFloat(item.quantity) // Convert to number for return
  };
};

describe('updatePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a pantry item with all fields', async () => {
    // First create an item
    const createdItem = await createTestPantryItem();

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Updated Item',
      quantity: 10,
      unit: 'kilograms',
      expiry_date: new Date('2025-01-15')
    };

    const result = await updatePantryItem(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdItem.id);
    expect(result.name).toEqual('Updated Item');
    expect(result.quantity).toEqual(10);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('kilograms');
    expect(result.expiry_date).toEqual(new Date('2025-01-15'));
    expect(result.added_date).toEqual(createdItem.added_date); // Should remain unchanged
  });

  it('should update only provided fields', async () => {
    // Create an item first
    const createdItem = await createTestPantryItem();

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Partially Updated Item',
      quantity: 15
      // unit and expiry_date not provided - should remain unchanged
    };

    const result = await updatePantryItem(updateInput);

    expect(result.name).toEqual('Partially Updated Item');
    expect(result.quantity).toEqual(15);
    expect(result.unit).toEqual('pieces'); // Should remain unchanged
    expect(result.expiry_date).toEqual(new Date('2024-12-31')); // Should remain unchanged
  });

  it('should update item in database', async () => {
    // Create an item first
    const createdItem = await createTestPantryItem();

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Database Updated Item',
      quantity: 25,
      unit: 'liters'
    };

    await updatePantryItem(updateInput);

    // Query database directly to verify update
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(1);
    const dbItem = items[0];
    expect(dbItem.name).toEqual('Database Updated Item');
    expect(parseFloat(dbItem.quantity)).toEqual(25);
    expect(dbItem.unit).toEqual('liters');
  });

  it('should update only name field', async () => {
    const createdItem = await createTestPantryItem();

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Name Only Update'
    };

    const result = await updatePantryItem(updateInput);

    expect(result.name).toEqual('Name Only Update');
    expect(result.quantity).toEqual(5);
    expect(result.unit).toEqual('pieces');
    expect(result.expiry_date).toEqual(new Date('2024-12-31'));
  });

  it('should update only expiry date', async () => {
    const createdItem = await createTestPantryItem();

    const newExpiryDate = new Date('2025-06-30');
    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    expect(result.expiry_date).toEqual(newExpiryDate);
    expect(result.name).toEqual('Test Item');
    expect(result.quantity).toEqual(5);
    expect(result.unit).toEqual('pieces');
  });

  it('should handle decimal quantities correctly', async () => {
    const createdItem = await createTestPantryItem();

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      quantity: 2.75
    };

    const result = await updatePantryItem(updateInput);

    expect(result.quantity).toEqual(2.75);
    expect(typeof result.quantity).toBe('number');

    // Verify in database
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(parseFloat(items[0].quantity)).toEqual(2.75);
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Item'
    };

    expect(updatePantryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve added_date when updating', async () => {
    const createdItem = await createTestPantryItem();
    const originalAddedDate = createdItem.added_date;

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Updated Item',
      quantity: 99,
      unit: 'tons',
      expiry_date: new Date('2025-12-31')
    };

    const result = await updatePantryItem(updateInput);

    expect(result.added_date).toEqual(originalAddedDate);
  });
});
