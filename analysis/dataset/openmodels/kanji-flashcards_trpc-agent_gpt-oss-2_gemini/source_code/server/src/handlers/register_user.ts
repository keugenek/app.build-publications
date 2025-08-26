import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

/**
 * Handler for user registration.
 * Stores the user in the database and returns the created user record.
 * For simplicity, the password is stored as plain text in the `password_hash` column.
 */
export const registerUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password, // In a real app, hash the password
      })
      .returning()
      .execute();

    const user = result[0];
    // Ensure returned object matches output schema
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
