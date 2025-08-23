import { type CreateUserInput, type User } from '../schema';

import { db } from '../db';
import { users } from '../db/schema';
import { createHash } from 'crypto';

/**
 * Creates a new user in the database.
 * The password is hashed using SHA-256 before persisting.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Simple SHA-256 hash for demonstration purposes
    const password_hash = createHash('sha256')
      .update(input.password)
      .digest('hex');

    const result = await db
      .insert(users)
      .values({
        email: input.email,
        password_hash,
      })
      .returning()
      .execute();

    // The insert returns an array with the inserted row
    const user = result[0];
    return user as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
