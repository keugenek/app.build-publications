import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';

export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // Insert collection record
    const result = await db.insert(collectionsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    const collection = result[0];
    return {
      ...collection,
      created_at: collection.created_at
    };
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
