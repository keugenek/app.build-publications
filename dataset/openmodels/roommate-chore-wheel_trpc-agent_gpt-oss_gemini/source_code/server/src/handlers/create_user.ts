import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

/**
 * Creates a new user in the database.
 * @param input - The user creation input (name).
 * @returns The newly created user record.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        name: input.name,
      })
      .returning()
      .execute();

    // The result is an array with the inserted row
    const user = result[0];
    return user as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
