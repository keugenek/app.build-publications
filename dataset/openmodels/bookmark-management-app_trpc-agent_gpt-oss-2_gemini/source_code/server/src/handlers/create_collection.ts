import { type CreateCollectionInput, type Collection } from '../schema';
import { db } from '../db';
import { collections } from '../db/schema';

/** Placeholder for creating a collection. */
export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // Insert collection record; user_id is nullable and not provided here
    const result = await db
      .insert(collections)
      .values({
        name: input.name,
        // user_id is optional; default to null (no owner)
        user_id: null,
      })
      .returning()
      .execute();

    // The inserted row is returned as the first element
    const collection = result[0];
    return collection as Collection;
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
