import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

/**
 * Fetch all gym members from the database.
 * Returns an array of {@link Member} objects.
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const rows = await db.select().from(membersTable).execute();
    // No numeric conversion needed as all columns map directly to JS types.
    return rows;
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};
