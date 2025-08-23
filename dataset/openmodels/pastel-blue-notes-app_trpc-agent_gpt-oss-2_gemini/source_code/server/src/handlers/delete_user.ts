import { type DeleteByIdInput, type User } from '../schema';

import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
/** Delete a user by ID and return the deleted user */
export const deleteUser = async (input: DeleteByIdInput): Promise<User> => {
  try {
    // Attempt to delete and return the deleted row
    const result = await db
      .delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    // Drizzle returns proper types, dates are Date objects
    const user = result[0];
    return user as User;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
};
