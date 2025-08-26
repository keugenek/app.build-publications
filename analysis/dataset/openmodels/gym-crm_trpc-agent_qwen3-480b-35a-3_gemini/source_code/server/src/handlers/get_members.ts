import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

export const getMembers = async (): Promise<Member[]> => {
  try {
    const results = await db.select()
      .from(membersTable)
      .execute();

    // Map results to ensure proper type conversion
    return results.map(member => ({
      ...member,
      created_at: new Date(member.created_at)
    }));
  } catch (error) {
    console.error('Fetching members failed:', error);
    throw error;
  }
};
