import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessTrends } from '../schema';
import { and, gte, lte, asc, SQL } from 'drizzle-orm';

export const getWellnessTrends = async (input?: GetWellnessEntriesInput): Promise<WellnessTrends> => {
  try {
    // Build conditions array for date filtering
    const conditions: SQL<unknown>[] = [];
    
    if (input?.start_date) {
      conditions.push(gte(wellnessEntriesTable.entry_date, input.start_date));
    }
    
    if (input?.end_date) {
      conditions.push(lte(wellnessEntriesTable.entry_date, input.end_date));
    }
    
    // Execute query with all conditions at once to avoid TypeScript issues
    const results = await (() => {
      if (conditions.length === 0) {
        // No filters - just order and limit
        if (input?.limit) {
          return db.select()
            .from(wellnessEntriesTable)
            .orderBy(asc(wellnessEntriesTable.entry_date))
            .limit(input.limit)
            .execute();
        } else {
          return db.select()
            .from(wellnessEntriesTable)
            .orderBy(asc(wellnessEntriesTable.entry_date))
            .execute();
        }
      } else {
        // With filters
        if (input?.limit) {
          return db.select()
            .from(wellnessEntriesTable)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .orderBy(asc(wellnessEntriesTable.entry_date))
            .limit(input.limit)
            .execute();
        } else {
          return db.select()
            .from(wellnessEntriesTable)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .orderBy(asc(wellnessEntriesTable.entry_date))
            .execute();
        }
      }
    })();
    
    // Convert numeric fields to numbers and date to Date object
    const entries = results.map(entry => ({
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score),
      entry_date: new Date(entry.entry_date)
    }));
    
    // Calculate averages if we have entries
    if (entries.length === 0) {
      return {
        entries: [],
        average_wellness_score: 0,
        average_sleep_hours: 0,
        average_stress_level: 0,
        average_caffeine_intake: 0,
        average_alcohol_intake: 0,
        total_entries: 0
      };
    }
    
    // Calculate sums for averages
    const totals = entries.reduce((acc, entry) => ({
      sleep_hours: acc.sleep_hours + entry.sleep_hours,
      stress_level: acc.stress_level + entry.stress_level,
      caffeine_intake: acc.caffeine_intake + entry.caffeine_intake,
      alcohol_intake: acc.alcohol_intake + entry.alcohol_intake,
      wellness_score: acc.wellness_score + entry.wellness_score
    }), {
      sleep_hours: 0,
      stress_level: 0,
      caffeine_intake: 0,
      alcohol_intake: 0,
      wellness_score: 0
    });
    
    const entryCount = entries.length;
    
    return {
      entries,
      average_wellness_score: Math.round((totals.wellness_score / entryCount) * 100) / 100,
      average_sleep_hours: Math.round((totals.sleep_hours / entryCount) * 100) / 100,
      average_stress_level: Math.round((totals.stress_level / entryCount) * 100) / 100,
      average_caffeine_intake: Math.round((totals.caffeine_intake / entryCount) * 100) / 100,
      average_alcohol_intake: Math.round((totals.alcohol_intake / entryCount) * 100) / 100,
      total_entries: entryCount
    };
  } catch (error) {
    console.error('Get wellness trends failed:', error);
    throw error;
  }
};
