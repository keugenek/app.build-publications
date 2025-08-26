import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { and, eq, ilike, type SQL } from 'drizzle-orm';
import { type SearchPlayersInput, type UserProfile } from '../schema';

export const searchPlayers = async (input: SearchPlayersInput): Promise<UserProfile[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add location filter if provided (case-insensitive partial match)
    if (input.location) {
      conditions.push(ilike(userProfilesTable.location, `%${input.location}%`));
    }

    // Add skill level filter if provided
    if (input.skill_level) {
      conditions.push(eq(userProfilesTable.skill_level, input.skill_level));
    }

    // Build and execute query
    if (conditions.length > 0) {
      const results = await db.select()
        .from(userProfilesTable)
        .where(and(...conditions))
        .execute();

      // Map results to match the schema type
      return results.map(user => ({
        ...user,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
    } else {
      // No filters, return all users
      const results = await db.select()
        .from(userProfilesTable)
        .execute();

      // Map results to match the schema type
      return results.map(user => ({
        ...user,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
    }
  } catch (error) {
    console.error('Search players failed:', error);
    throw error;
  }
};
