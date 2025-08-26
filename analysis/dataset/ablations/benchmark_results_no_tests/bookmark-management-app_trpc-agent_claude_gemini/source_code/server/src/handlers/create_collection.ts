import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // Verify that the user exists to prevent foreign key constraint violations
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert collection record
    const result = await db.insert(collectionsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
