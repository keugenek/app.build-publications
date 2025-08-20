import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import crypto from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password using crypto.pbkdf2
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(input.password, salt, 1000, 64, 'sha256').toString('hex');
    const password_hash = `${salt}:${hash}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: password_hash
      })
      .returning()
      .execute();

    // Return the created user
    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
