import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      ...user,
      created_at: new Date(user.created_at)
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
