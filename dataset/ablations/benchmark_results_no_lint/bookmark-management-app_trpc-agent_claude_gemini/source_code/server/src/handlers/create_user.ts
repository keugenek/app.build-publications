import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq, or } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if user with same email or username already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(or(
        eq(usersTable.email, input.email),
        eq(usersTable.username, input.username)
      ))
      .execute();

    if (existingUser.length > 0) {
      const existingByEmail = existingUser.find(user => user.email === input.email);
      const existingByUsername = existingUser.find(user => user.username === input.username);
      
      if (existingByEmail) {
        throw new Error('User with this email already exists');
      }
      if (existingByUsername) {
        throw new Error('User with this username already exists');
      }
    }

    // Create new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        username: input.username
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
