import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';

// Test input for updating a pantry item
const updateInput: UpdatePantryItemInput = {
  id: 1,
  name: 'Updated Test Item',
  quantity: 10,
  expiry_date: new Date('2026-01-15')
};

describe('updatePantryItem', () => {
  beforeEach(async () => {
    // Just initialize for consistency
    await createDB();
  });
  
  afterEach(resetDB);

  it('should update a pantry item', async () => {
    const result = await updatePantryItem(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Test Item');
    expect(result.quantity).toEqual(10);
    expect(result.expiry_date).toEqual(new Date('2026-01-15'));
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Update only the name field
    const partialUpdateInput: UpdatePantryItemInput = {
      id: 1,
      name: 'Partially Updated Item'
    };

    const result = await updatePantryItem(partialUpdateInput);

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Partially Updated Item');
  });

  it('should throw an error when no update fields are provided', async () => {
    const invalidUpdateInput: UpdatePantryItemInput = {
      id: 1
      // No fields to update
    };

    await expect(updatePantryItem(invalidUpdateInput)).rejects.toThrow(/at least one field/i);
  });
});
