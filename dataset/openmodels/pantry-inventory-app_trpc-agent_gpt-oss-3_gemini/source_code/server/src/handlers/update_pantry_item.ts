import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';

/**
 * Handler to update a pantry item in the database.
 * Performs a partial update based on provided fields and returns the updated record.
 * Numeric fields are stored as strings in the DB and converted back to numbers on return.
 */
export const updatePantryItem = async (
  input: UpdatePantryItemInput,
): Promise<PantryItem> => {
  try {
    // Build update values based on provided fields
    const updateValues: Partial<
      typeof pantryItemsTable.$inferInsert
    > = {};

    if (input.name !== undefined) updateValues.name = input.name;
    if (input.quantity !== undefined) {
      // numeric column stored as string, convert number to string
      updateValues.quantity = input.quantity.toString();
    }
    if (input.unit !== undefined) updateValues.unit = input.unit;
    if (input.expiry_date !== undefined) updateValues.expiry_date = input.expiry_date;

    // Perform update and return the updated row
    const result = await db
      .update(pantryItemsTable)
      .set(updateValues)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    // Convert numeric fields back to numbers before returning
    return {
      ...updated,
      quantity: parseFloat(updated.quantity as any),
    } as PantryItem;
  } catch (error) {
    console.error('Update pantry item failed:', error);
    throw error;
  }
};
