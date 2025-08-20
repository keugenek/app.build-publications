import { type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await db.select()
      .from(usersTable)
      .execute();
    // No numeric columns require conversion; return as is
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
  
};
