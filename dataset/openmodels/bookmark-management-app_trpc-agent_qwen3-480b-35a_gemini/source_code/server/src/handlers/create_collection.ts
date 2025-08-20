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
        description: input.description,
      })
      .returning()
      .execute();

    const dbCollection = result[0];
    
    // Map to the Collection type (excluding is_public since it's not in the schema)
    return {
      id: dbCollection.id,
      user_id: dbCollection.user_id,
      name: dbCollection.name,
      description: dbCollection.description,
      created_at: dbCollection.created_at,
      updated_at: dbCollection.updated_at,
    };
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
