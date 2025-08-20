import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    // Fetch all users from the database
    const result = await db.select()
      .from(usersTable)
      .execute();

    // Return the users directly as they match the User type
    return result;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
