import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchFilters, type UserProfile } from '../schema';
import { and, eq, type SQL } from 'drizzle-orm';

export const searchPlayers = async (filters: SearchFilters): Promise<UserProfile[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters.skill_level) {
      conditions.push(eq(userProfilesTable.skill_level, filters.skill_level));
    }

    if (filters.city) {
      conditions.push(eq(userProfilesTable.city, filters.city));
    }

    if (filters.state) {
      conditions.push(eq(userProfilesTable.state, filters.state));
    }

    // Build query with or without where clause
    const results = conditions.length > 0
      ? await db.select()
          .from(userProfilesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(userProfilesTable)
          .execute();

    // Return the results directly as they match UserProfile type
    return results;
  } catch (error) {
    console.error('Player search failed:', error);
    throw error;
  }
};
