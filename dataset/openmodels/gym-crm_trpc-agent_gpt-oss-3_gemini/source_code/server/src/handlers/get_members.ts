import { type Member } from '../schema';

import { db } from '../db';
import { membersTable } from '../db/schema';

// Fetch all members from the database
export const getMembers = async (): Promise<Member[]> => {
  try {
    const members = await db.select().from(membersTable).execute();
    return members;
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};

