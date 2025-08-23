import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput } from '../schema';
import { updatePantryItem } from '../handlers/update_pantry_item';
import { eq } from 'drizzle-orm';

describe('updatePantryItem', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test item directly in the database
    await db.insert(pantryItemsTable)
      .values({
        name: 'Test Item',
        quantity: 5,
        expiry_date: '2023-12-31'
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a pantry item name', async () => {
    // First, get the item we created
    const items = await db.select().from(pantryItemsTable).execute();
    const itemToUpdate = items[0];
    
    const updateInput: UpdatePantryItemInput = {
      id: itemToUpdate.id,
      name: 'Updated Item Name'
    };

    const result = await updatePantryItem(updateInput);

    // Validate the result
    expect(result.id).toEqual(itemToUpdate.id);
    expect(result.name).toEqual('Updated Item Name');
    expect(result.quantity).toEqual(itemToUpdate.quantity);
    expect(result.expiry_date.getTime()).toEqual(new Date(itemToUpdate.expiry_date).getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(new Date(itemToUpdate.updated_at).getTime());
  });

  it('should update pantry item quantity', async () => {
    // First, get the item we created
    const items = await db.select().from(pantryItemsTable).execute();
    const itemToUpdate = items[0];
    
    const updateInput: UpdatePantryItemInput = {
      id: itemToUpdate.id,
      quantity: 10
    };

    const result = await updatePantryItem(updateInput);

    // Validate the result
    expect(result.id).toEqual(itemToUpdate.id);
    expect(result.name).toEqual(itemToUpdate.name);
    expect(result.quantity).toEqual(10);
    expect(result.expiry_date.getTime()).toEqual(new Date(itemToUpdate.expiry_date).getTime());
  });

  it('should update pantry item expiry date', async () => {
    // First, get the item we created
    const items = await db.select().from(pantryItemsTable).execute();
    const itemToUpdate = items[0];
    
    const newExpiryDate = new Date('2024-06-30');
    const updateInput: UpdatePantryItemInput = {
      id: itemToUpdate.id,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    // Validate the result
    expect(result.id).toEqual(itemToUpdate.id);
    expect(result.name).toEqual(itemToUpdate.name);
    expect(result.quantity).toEqual(itemToUpdate.quantity);
    expect(result.expiry_date.getTime()).toEqual(newExpiryDate.getTime());
  });

  it('should update multiple fields at once', async () => {
    // First, get the item we created
    const items = await db.select().from(pantryItemsTable).execute();
    const itemToUpdate = items[0];
    
    const newExpiryDate = new Date('2024-01-15');
    const updateInput: UpdatePantryItemInput = {
      id: itemToUpdate.id,
      name: 'Completely Updated Item',
      quantity: 20,
      expiry_date: newExpiryDate
    };

    const result = await updatePantryItem(updateInput);

    // Validate the result
    expect(result.id).toEqual(itemToUpdate.id);
    expect(result.name).toEqual('Completely Updated Item');
    expect(result.quantity).toEqual(20);
    expect(result.expiry_date.getTime()).toEqual(newExpiryDate.getTime());
  });

  it('should throw an error when trying to update a non-existent item', async () => {
    const updateInput: UpdatePantryItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    await expect(updatePantryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should save updated item to database', async () => {
    // First, get the item we created
    const items = await db.select().from(pantryItemsTable).execute();
    const itemToUpdate = items[0];
    
    const updateInput: UpdatePantryItemInput = {
      id: itemToUpdate.id,
      name: 'Database Updated Item',
      quantity: 15
    };

    const result = await updatePantryItem(updateInput);

    // Query the database to verify the update was saved
    const updatedItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, result.id))
      .execute();

    expect(updatedItems).toHaveLength(1);
    const updatedItem = updatedItems[0];
    expect(updatedItem.name).toEqual('Database Updated Item');
    expect(updatedItem.quantity).toEqual(15);
    expect(new Date(updatedItem.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(itemToUpdate.updated_at).getTime());
  });
});
