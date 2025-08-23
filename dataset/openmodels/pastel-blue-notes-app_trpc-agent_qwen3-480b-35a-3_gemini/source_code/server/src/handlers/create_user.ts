import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name
      })
      .returning()
      .execute();
    
    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
