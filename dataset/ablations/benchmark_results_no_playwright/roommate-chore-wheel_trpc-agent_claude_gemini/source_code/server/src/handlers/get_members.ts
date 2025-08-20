import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

export const getMembers = async (): Promise<Member[]> => {
  try {
    // Fetch all members from the database
    const results = await db.select()
      .from(membersTable)
      .execute();

    // Return the members (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};
