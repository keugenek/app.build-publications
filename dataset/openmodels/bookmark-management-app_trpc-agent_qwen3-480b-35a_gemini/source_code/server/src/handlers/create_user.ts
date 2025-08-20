import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name || '',
        password_hash: 'placeholder_hash' // In a real app, this would be a proper hash
      })
      .returning()
      .execute();

    // Return the created user with proper typing
    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
