import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type CreatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test pantry item
const createTestItem = async (itemData: CreatePantryItemInput) => {
  const result = await db.insert(pantryItemsTable)
    .values({
      name: itemData.name,
      quantity: itemData.quantity.toString(),
      expiry_date: itemData.expiry_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    })
    .returning()
    .execute();

  return {
    ...result[0],
    quantity: parseFloat(result[0].quantity),
    expiry_date: new Date(result[0].expiry_date) // Convert string back to Date
  };
};

describe('updatePantryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a pantry item with all fields', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      name: 'Updated Item',
      quantity: 10,
      expiry_date: new Date('2024-02-01')
    };

    const result = await updatePantryItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(initialItem.id);
    expect(result.name).toEqual('Updated Item');
    expect(result.quantity).toEqual(10);
    expect(result.expiry_date.toDateString()).toEqual(new Date('2024-02-01').toDateString());
    expect(result.created_at).toEqual(initialItem.created_at);
    expect(result.updated_at).not.toEqual(initialItem.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    // Update only the name
    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      name: 'Only Name Updated'
    };

    const result = await updatePantryItem(updateInput);

    // Verify only name was updated
    expect(result.name).toEqual('Only Name Updated');
    expect(result.quantity).toEqual(initialItem.quantity); // Should remain unchanged
    expect(result.expiry_date).toEqual(initialItem.expiry_date); // Should remain unchanged
    expect(result.updated_at).not.toEqual(initialItem.updated_at); // Should be updated
  });

  it('should update only quantity', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    // Update only the quantity
    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      quantity: 15.5
    };

    const result = await updatePantryItem(updateInput);

    // Verify only quantity was updated
    expect(result.name).toEqual(initialItem.name); // Should remain unchanged
    expect(result.quantity).toEqual(15.5);
    expect(typeof result.quantity).toBe('number'); // Ensure numeric conversion
    expect(result.expiry_date).toEqual(initialItem.expiry_date); // Should remain unchanged
    expect(result.updated_at).not.toEqual(initialItem.updated_at); // Should be updated
  });

  it('should update only expiry date', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    // Update only the expiry date
    const newExpiryDate = new Date('2024-12-31');
    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    // Verify only expiry date was updated
    expect(result.name).toEqual(initialItem.name); // Should remain unchanged
    expect(result.quantity).toEqual(initialItem.quantity); // Should remain unchanged
    expect(result.expiry_date.toDateString()).toEqual(newExpiryDate.toDateString());
    expect(result.updated_at).not.toEqual(initialItem.updated_at); // Should be updated
  });

  it('should save updated item to database', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      name: 'Database Updated Item',
      quantity: 20
    };

    await updatePantryItem(updateInput);

    // Verify the changes are persisted in the database
    const savedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, initialItem.id))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].name).toEqual('Database Updated Item');
    expect(parseFloat(savedItems[0].quantity)).toEqual(20);
    expect(savedItems[0].updated_at).not.toEqual(initialItem.updated_at);
    expect(savedItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Item'
    };

    expect(updatePantryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Original Item',
      quantity: 5,
      expiry_date: new Date('2024-01-01')
    });

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with minimal change to ensure timestamp update
    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      name: initialItem.name // Set same name to trigger update
    };

    const result = await updatePantryItem(updateInput);

    // Verify timestamp was updated
    expect(result.updated_at).not.toEqual(initialItem.updated_at);
    expect(result.updated_at > initialItem.updated_at).toBe(true);
  });

  it('should handle decimal quantities correctly', async () => {
    // Create initial item
    const initialItem = await createTestItem({
      name: 'Decimal Item',
      quantity: 1.5,
      expiry_date: new Date('2024-01-01')
    });

    const updateInput: UpdatePantryItemInput = {
      id: initialItem.id,
      quantity: 3.75
    };

    const result = await updatePantryItem(updateInput);

    // Verify decimal quantity handling
    expect(result.quantity).toEqual(3.75);
    expect(typeof result.quantity).toBe('number');

    // Verify in database
    const savedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, initialItem.id))
      .execute();

    expect(parseFloat(savedItems[0].quantity)).toEqual(3.75);
  });
});
