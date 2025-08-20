import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

/**
 * Fetch all users from the database.
 * Returns an array of users matching the {@link User} schema.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const rows = await db.select().from(usersTable).execute();
    // Map DB rows to the Zod‑derived User type (ensuring correct shape).
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
