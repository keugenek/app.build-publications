import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { createHash } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password using SHA-256 (in a real app, use bcrypt)
    const password_hash = createHash('sha256').update(input.password).digest('hex');

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: password_hash
      })
      .returning()
      .execute();

    // Return the created user
    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
