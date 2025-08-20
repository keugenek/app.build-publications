import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // Validate that the user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Check if collection name is unique within the user's collections
    const existingCollection = await db.select()
      .from(collectionsTable)
      .where(
        and(
          eq(collectionsTable.user_id, input.user_id),
          eq(collectionsTable.name, input.name)
        )
      )
      .execute();

    if (existingCollection.length > 0) {
      throw new Error('Collection name already exists for this user');
    }

    // Insert collection record
    const result = await db.insert(collectionsTable)
      .values({
        name: input.name,
        description: input.description,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
