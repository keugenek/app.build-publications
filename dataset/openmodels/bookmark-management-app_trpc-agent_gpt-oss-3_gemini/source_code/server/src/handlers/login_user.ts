import { type LoginUserInput, type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler for user login.
 * Verifies that a user exists with the given email and that the provided password
 * matches the stored password_hash (plain‑text for this kata). Returns the full
 * User record on success. Throws an error with message "Invalid credentials"
 * for any authentication failure.
 */
export const loginUser = async (input: LoginUserInput): Promise<User> => {
  try {
    // Fetch user by email
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const found = users[0];

    // Plain‑text password comparison (for test purposes only)
    if (found.password_hash !== input.password) {
      throw new Error('Invalid credentials');
    }

    // Return the user record matching the Zod schema
    return {
      id: found.id,
      email: found.email,
      password_hash: found.password_hash,
      created_at: found.created_at,
    } as User;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
