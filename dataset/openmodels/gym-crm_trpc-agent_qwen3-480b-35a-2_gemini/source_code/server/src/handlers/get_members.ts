import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

export const getMembers = async (): Promise<Member[]> => {
  try {
    const results = await db.select()
      .from(membersTable)
      .execute();

    return results.map(member => ({
      ...member,
      created_at: member.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};
