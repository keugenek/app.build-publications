import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

/**
 * Fetch all members from the database.
 * Returns an array of {@link Member} objects.
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    // Simple select query – no filters needed
    const members = await db.select().from(membersTable).execute();
    return members;
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};
