import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchUsersInput, type UserProfile } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const searchUsers = async (input: SearchUsersInput): Promise<UserProfile[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.skill_level) {
      conditions.push(eq(userProfilesTable.skill_level, input.skill_level));
    }

    if (input.location) {
      conditions.push(eq(userProfilesTable.location, input.location));
    }

    // Build query with optional where clause
    const query = conditions.length > 0
      ? db.select().from(userProfilesTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(userProfilesTable);

    // Execute the query
    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('User search failed:', error);
    throw error;
  }
};
