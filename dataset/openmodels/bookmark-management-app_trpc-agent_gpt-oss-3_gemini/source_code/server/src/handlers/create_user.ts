import { type CreateUserInput, type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';

/**
 * Creates a new user in the database.
 * In a real implementation the password would be hashed; here we store a placeholder hash.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: 'hashed_placeholder', // placeholder for hashed password
      })
      .returning()
      .execute();

    const user = result[0];
    // The record returned by Drizzle already matches the Zod User shape (id, email, password_hash, created_at)
    return user as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
