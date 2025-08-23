import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';

/**
 * Updates a user record in the database.
 * Only the fields provided in the input are updated.
 * Returns the updated user.
 */
export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build the fields to update based on provided input
    const updates: Partial<{
      email: string;
      password_hash: string;
    }> = {};

    if (input.email !== undefined) {
      updates.email = input.email;
    }
    if (input.password !== undefined) {
      // Simple placeholder hashing; replace with real hashing in production
      updates.password_hash = 'hashed-' + input.password;
    }

    // Perform the update and return the updated row
    const result = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    // If no rows were updated, throw an error
    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Drizzle returns Date objects for timestamp columns, so we can return directly
    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
    } as User;
  } catch (error) {
    console.error('Update user failed:', error);
    throw error;
  }
};
