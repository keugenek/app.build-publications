import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { createHash, randomBytes, pbkdf2Sync } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate a random salt
    const salt = randomBytes(16).toString('hex');
    
    // Hash the password using PBKDF2
    const hash = pbkdf2Sync(input.password, salt, 10000, 64, 'sha256');
    const password_hash = salt + ':' + hash.toString('hex');

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash
      })
      .returning()
      .execute();

    // Return the created user
    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
