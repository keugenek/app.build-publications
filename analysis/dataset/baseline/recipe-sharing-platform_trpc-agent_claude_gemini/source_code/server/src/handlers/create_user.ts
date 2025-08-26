import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq, or } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if username or email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(or(
        eq(usersTable.username, input.username),
        eq(usersTable.email, input.email)
      ))
      .execute();

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === input.username) {
        throw new Error(`Username '${input.username}' is already taken`);
      }
      if (existingUser.email === input.email) {
        throw new Error(`Email '${input.email}' is already registered`);
      }
    }

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
