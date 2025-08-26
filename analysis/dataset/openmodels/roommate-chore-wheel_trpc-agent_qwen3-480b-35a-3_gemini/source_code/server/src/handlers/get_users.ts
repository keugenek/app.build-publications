import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();
    
    return results.map(user => ({
      ...user,
      created_at: user.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
