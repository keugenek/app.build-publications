import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';

/** Create a new collection in the database */
export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    const result = await db
      .insert(collectionsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description ?? null,
      })
      .returning()
      .execute();

    const row = result[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
    } as Collection;
  } catch (error) {
    console.error('Failed to create collection:', error);
    throw error;
  }
};

/** Fetch all collections from the database */
export const getCollections = async (): Promise<Collection[]> => {
  try {
    const rows = await db.select().from(collectionsTable).execute();
    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
    } as Collection));
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw error;
  }
};
