import { type CreateCollectionInput, type Collection } from '../schema';

import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/** Create a new collection for a user */
export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  // Verify that the user exists to satisfy foreign key constraints
  const userRows = await db.select()
    .from(usersTable)
    .where(eq(usersTable.id, input.user_id))
    .execute();

  if (userRows.length === 0) {
    console.error('User not found for collection creation:', input.user_id);
    throw new Error('User not found');
  }

  // Insert the collection record
  const result = await db.insert(collectionsTable)
    .values({
      user_id: input.user_id,
      name: input.name,
    })
    .returning()
    .execute();

  // Drizzle returns an array; return the first element
  return result[0] as Collection;
};
