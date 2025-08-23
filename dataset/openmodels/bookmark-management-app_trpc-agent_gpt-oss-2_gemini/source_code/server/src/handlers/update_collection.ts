import { db } from '../db';
import { collections } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCollectionInput, type Collection } from '../schema';

/**
 * Updates a collection's name.
 * Returns the updated collection record.
 * Throws an error if the collection does not exist.
 */
export const updateCollection = async (input: UpdateCollectionInput): Promise<Collection> => {
  try {
    const result = await db
      .update(collections)
      .set({
        // Only set name if it was provided; otherwise keep existing value
        ...(input.name !== undefined ? { name: input.name } : {}),
      })
      .where(eq(collections.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error(`Collection with id ${input.id} not found`);
    }
    return updated as Collection;
  } catch (error) {
    console.error('Failed to update collection:', error);
    throw error;
  }
};
