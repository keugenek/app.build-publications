import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type UpdateCollectionInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCollection = async (input: UpdateCollectionInput): Promise<Collection> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof collectionsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the collection record
    const result = await db.update(collectionsTable)
      .set(updateData)
      .where(eq(collectionsTable.id, input.id))
      .returning()
      .execute();

    // Check if collection was found and updated
    if (result.length === 0) {
      throw new Error(`Collection with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Collection update failed:', error);
    throw error;
  }
};
