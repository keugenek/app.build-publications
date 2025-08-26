import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export async function getUsers(): Promise<User[]> {
  try {
    const users = await db.select()
      .from(usersTable)
      .execute();
    
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
