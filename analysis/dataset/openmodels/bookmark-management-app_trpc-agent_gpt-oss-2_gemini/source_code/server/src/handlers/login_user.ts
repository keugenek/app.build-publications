import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginUserInput, type User } from '../schema';

/**
 * Simple login implementation.
 * Looks up a user by email and verifies the provided password matches the stored password_hash.
 * For demonstration purposes we treat `password_hash` as a plain password.
 */
export const loginUser = async (input: LoginUserInput): Promise<User> => {
  try {
    // Find user by email
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1)
      .execute();

    const found = result[0];
    if (!found) {
      throw new Error('User not found');
    }

    // Simple password check (no hashing in this example)
    if (found.password_hash !== input.password) {
      throw new Error('Invalid password');
    }

    // Return user data matching the schema type
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
