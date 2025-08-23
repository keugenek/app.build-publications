import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

/**
 * Creates a new user in the database.
 * In a real application the password would be hashed before storage.
 * For this minimal implementation we store the raw password string as the hash.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record. `password_hash` column expects a string.
    const result = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password, // placeholder for hashed password
      })
      .returning()
      .execute();

    // Drizzle returns an array of inserted rows.
    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
    } as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
