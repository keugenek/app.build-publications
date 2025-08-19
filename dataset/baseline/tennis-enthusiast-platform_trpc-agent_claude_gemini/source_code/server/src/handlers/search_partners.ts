import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchPartnersInput, type UserProfile } from '../schema';
import { and, ilike, type SQL } from 'drizzle-orm';

export const searchPartners = async (input: SearchPartnersInput): Promise<UserProfile[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Apply skill level filter (partial match, case insensitive)
    if (input.skill_level) {
      conditions.push(ilike(userProfilesTable.skill_level, `%${input.skill_level}%`));
    }

    // Apply location filter (partial match, case insensitive)
    if (input.location) {
      conditions.push(ilike(userProfilesTable.location, `%${input.location}%`));
    }

    // Build and execute query
    const baseQuery = db.select().from(userProfilesTable);
    
    const queryWithConditions = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await queryWithConditions.limit(input.limit).execute();
    return results;
  } catch (error) {
    console.error('Partner search failed:', error);
    throw error;
  }
};
