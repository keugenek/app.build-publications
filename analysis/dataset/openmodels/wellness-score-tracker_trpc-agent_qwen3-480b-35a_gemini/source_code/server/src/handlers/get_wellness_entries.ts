import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type WellnessEntry } from '../schema';
import { and, desc, gte, lte, eq } from 'drizzle-orm';

export interface GetWellnessEntriesFilters {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const getWellnessEntries = async (
  userId: string,
  filters: GetWellnessEntriesFilters = {}
): Promise<WellnessEntry[]> => {
  try {
    // Collect all conditions
    const conditions = [eq(wellnessEntriesTable.user_id, userId)];
    
    if (filters.startDate) {
      conditions.push(gte(wellnessEntriesTable.created_at, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(wellnessEntriesTable.created_at, filters.endDate));
    }
    
    // Build query without intermediate reassignments
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(and(...conditions))
      .orderBy(desc(wellnessEntriesTable.created_at))
      .limit(filters.limit ?? 1000000) // Use large number if no limit
      .offset(filters.offset ?? 0)
      .execute();

    // If no limit was specified, return all results
    const finalResults = filters.limit === undefined 
      ? results.slice(filters.offset ?? 0) 
      : results;

    // Convert numeric fields back to numbers before returning
    return finalResults.map(entry => ({
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      wellness_score: parseFloat(entry.wellness_score),
      created_at: new Date(entry.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch wellness entries:', error);
    throw error;
  }
};
