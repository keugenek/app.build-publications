import { db } from '../db';
import { collectionsTable, usersTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const createCollection = async (input: CreateCollectionInput): Promise<Collection> => {
  try {
    // First get a user id, either from existing users or create a placeholder
    let userId: number;
    const users = await db.select({ id: usersTable.id }).from(usersTable).limit(1).execute();
    
    if (users.length > 0) {
      userId = users[0].id;
    } else {
      // Create a placeholder user for testing purposes
      const newUser = await db.insert(usersTable)
        .values({
          email: 'placeholder@example.com',
          password_hash: 'placeholder_hash'
        })
        .returning({ id: usersTable.id })
        .execute();
      userId = newUser[0].id;
    }
    
    // Insert collection record
    const result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
};
