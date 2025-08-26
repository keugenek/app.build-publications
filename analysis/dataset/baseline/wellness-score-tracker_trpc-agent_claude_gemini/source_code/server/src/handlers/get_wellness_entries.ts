import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessEntry } from '../schema';
import { and, gte, lte, SQL } from 'drizzle-orm';

export const getWellnessEntries = async (input?: GetWellnessEntriesInput): Promise<WellnessEntry[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.start_date) {
      const startDate = new Date(input.start_date);
      conditions.push(gte(wellnessEntriesTable.entry_date, startDate.toISOString().split('T')[0]));
    }

    if (input?.end_date) {
      const endDate = new Date(input.end_date);
      conditions.push(lte(wellnessEntriesTable.entry_date, endDate.toISOString().split('T')[0]));
    }

    // Execute query based on conditions and limit
    let results;
    
    if (conditions.length === 0 && !input?.limit) {
      // No filters, no limit
      results = await db.select().from(wellnessEntriesTable).execute();
    } else if (conditions.length === 0 && input?.limit) {
      // No filters, with limit
      results = await db.select().from(wellnessEntriesTable).limit(input.limit).execute();
    } else if (conditions.length > 0 && !input?.limit) {
      // With filters, no limit
      results = await db.select()
        .from(wellnessEntriesTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .execute();
    } else {
      // With filters and limit
      results = await db.select()
        .from(wellnessEntriesTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(input!.limit!)
        .execute();
    }

    // Convert numeric fields back to numbers for return
    return results.map(entry => ({
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score),
      entry_date: new Date(entry.entry_date),
      created_at: entry.created_at
    }));
  } catch (error) {
    console.error('Get wellness entries failed:', error);
    throw error;
  }
};
