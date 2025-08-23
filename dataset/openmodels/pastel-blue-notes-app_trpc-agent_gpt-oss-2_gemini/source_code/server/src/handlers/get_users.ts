import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
// import { sql } from 'drizzle-orm';

/** Fetch all users from the database */
export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select().from(usersTable).execute();
    // Drizzle returns rows with proper types; ensure numeric fields are numbers
    // (id is already a number, created_at is a Date)
    return results.map(user => ({
      id: Number(user.id),
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
