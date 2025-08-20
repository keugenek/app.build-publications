import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type CreatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

// Test helper to create a pantry item for testing
const createTestItem = async (itemData: CreatePantryItemInput) => {
  const result = await db.insert(pantryItemsTable)
    .values({
      name: itemData.name,
      quantity: itemData.quantity,
      expiry_date: itemData.expiry_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    })
    .returning()
    .execute();

  return {
    ...result[0],
    expiry_date: new Date(result[0].expiry_date) // Convert string back to Date
  };
};

const testItemData: CreatePantryItemInput = {
  name: 'Test Milk',
  quantity: 2.5,
  expiry_date: new Date('2024-12-31')
};

describe('updatePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a pantry item', async () => {
    // Create test item first
    const createdItem = await createTestItem(testItemData);

    const newExpiryDate = new Date('2024-11-30');
    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Updated Almond Milk',
      quantity: 1.5,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdItem.id);
    expect(result.name).toEqual('Updated Almond Milk');
    expect(result.quantity).toEqual(1.5);
    expect(typeof result.quantity).toEqual('number');
    expect(result.expiry_date).toEqual(newExpiryDate);
    expect(result.created_at).toEqual(createdItem.created_at); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });

  it('should update only name field', async () => {
    const createdItem = await createTestItem(testItemData);

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Updated Name Only'
    };

    const result = await updatePantryItem(updateInput);

    expect(result.name).toEqual('Updated Name Only');
    expect(result.quantity).toEqual(createdItem.quantity); // Should remain unchanged
    expect(result.expiry_date.toISOString().split('T')[0]).toEqual(createdItem.expiry_date.toISOString().split('T')[0]); // Should remain unchanged (compare date strings)
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });

  it('should update only quantity field', async () => {
    const createdItem = await createTestItem(testItemData);

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      quantity: 5.0
    };

    const result = await updatePantryItem(updateInput);

    expect(result.name).toEqual(createdItem.name); // Should remain unchanged
    expect(result.quantity).toEqual(5.0);
    expect(typeof result.quantity).toEqual('number');
    expect(result.expiry_date.toISOString().split('T')[0]).toEqual(createdItem.expiry_date.toISOString().split('T')[0]); // Should remain unchanged (compare date strings)
    expect(result.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });

  it('should update only expiry_date field', async () => {
    const createdItem = await createTestItem(testItemData);

    const newExpiryDate = new Date('2025-01-15');
    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    expect(result.name).toEqual(createdItem.name); // Should remain unchanged
    expect(result.quantity).toEqual(createdItem.quantity); // Should remain unchanged
    expect(result.expiry_date).toEqual(newExpiryDate);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });

  it('should save updates to database', async () => {
    const createdItem = await createTestItem(testItemData);

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: 'Database Test Update',
      quantity: 3.75
    };

    await updatePantryItem(updateInput);

    // Query database directly to verify changes were persisted
    const savedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(savedItems).toHaveLength(1);
    const savedItem = savedItems[0];
    expect(savedItem.name).toEqual('Database Test Update');
    expect(savedItem.quantity).toEqual(3.75);
    expect(new Date(savedItem.expiry_date)).toEqual(createdItem.expiry_date); // Unchanged
    expect(savedItem.updated_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updatePantryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle decimal quantities correctly', async () => {
    const createdItem = await createTestItem(testItemData);

    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      quantity: 1.234567 // Test precise decimal
    };

    const result = await updatePantryItem(updateInput);

    expect(result.quantity).toEqual(1.234567);
    expect(typeof result.quantity).toEqual('number');

    // Verify in database
    const savedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, createdItem.id))
      .execute();

    expect(savedItems[0].quantity).toEqual(1.234567);
  });

  it('should always update the updated_at timestamp', async () => {
    const createdItem = await createTestItem(testItemData);

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with minimal change
    const updateInput: UpdatePantryItemInput = {
      id: createdItem.id,
      name: createdItem.name // Same name, but should still update timestamp
    };

    const result = await updatePantryItem(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdItem.updated_at.getTime());
  });
});
