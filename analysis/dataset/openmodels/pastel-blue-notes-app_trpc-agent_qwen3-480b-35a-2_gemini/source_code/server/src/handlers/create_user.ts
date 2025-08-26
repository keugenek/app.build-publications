import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password
    const hashedPassword = await hash(input.password, SALT_ROUNDS);
    
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: hashedPassword,
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
