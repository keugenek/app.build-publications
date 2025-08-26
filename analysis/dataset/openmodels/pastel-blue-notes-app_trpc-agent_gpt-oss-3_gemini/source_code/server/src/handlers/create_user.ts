import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

/**
 * Creates a new user record in the database.
 * For simplicity the password is stored directly in the `password_hash` column.
 * In a real application you would hash the password before persisting.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password, // Store plain password for demo purposes
      })
      .returning()
      .execute();

    const user = result[0];
    // The returned row already contains a Date for created_at
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    } as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
