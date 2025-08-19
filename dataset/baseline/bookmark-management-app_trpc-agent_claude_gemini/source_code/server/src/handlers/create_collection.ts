import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // Verify the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
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
