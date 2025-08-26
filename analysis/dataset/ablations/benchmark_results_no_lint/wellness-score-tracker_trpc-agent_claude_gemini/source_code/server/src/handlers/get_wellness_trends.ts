import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput } from '../schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';

// Wellness trends response type
export interface WellnessTrend {
  date: string; // Date in YYYY-MM-DD format
  wellness_score: number;
  sleep_hours: number;
  stress_level: number;
  caffeine_intake: number;
  alcohol_intake: number;
}

export interface WellnessTrendsResponse {
  trends: WellnessTrend[];
  averages: {
    wellness_score: number;
    sleep_hours: number;
    stress_level: number;
    caffeine_intake: number;
    alcohol_intake: number;
  };
  summary: {
    total_entries: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}

export async function getWellnessTrends(input: GetWellnessEntriesInput): Promise<WellnessTrendsResponse> {
  try {
    // Collect conditions for filtering
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(wellnessEntriesTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(wellnessEntriesTable.date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(wellnessEntriesTable.date, input.end_date));
    }

    // Build the base query with conditions
    const baseQuery = db.select()
      .from(wellnessEntriesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(wellnessEntriesTable.date));

    // Apply limit if specified and execute
    const results = input.limit 
      ? await baseQuery.limit(input.limit).execute()
      : await baseQuery.execute();

    // Convert numeric fields and format data
    const trends: WellnessTrend[] = results.map(entry => ({
      date: entry.date,
      wellness_score: parseFloat(entry.wellness_score),
      sleep_hours: parseFloat(entry.sleep_hours),
      stress_level: entry.stress_level,
      caffeine_intake: entry.caffeine_intake,
      alcohol_intake: entry.alcohol_intake
    }));

    // Calculate averages
    const totalEntries = trends.length;
    let averages = {
      wellness_score: 0,
      sleep_hours: 0,
      stress_level: 0,
      caffeine_intake: 0,
      alcohol_intake: 0
    };

    if (totalEntries > 0) {
      const totals = trends.reduce(
        (acc, trend) => ({
          wellness_score: acc.wellness_score + trend.wellness_score,
          sleep_hours: acc.sleep_hours + trend.sleep_hours,
          stress_level: acc.stress_level + trend.stress_level,
          caffeine_intake: acc.caffeine_intake + trend.caffeine_intake,
          alcohol_intake: acc.alcohol_intake + trend.alcohol_intake
        }),
        { wellness_score: 0, sleep_hours: 0, stress_level: 0, caffeine_intake: 0, alcohol_intake: 0 }
      );

      averages = {
        wellness_score: Math.round((totals.wellness_score / totalEntries) * 100) / 100, // Round to 2 decimal places
        sleep_hours: Math.round((totals.sleep_hours / totalEntries) * 100) / 100,
        stress_level: Math.round((totals.stress_level / totalEntries) * 100) / 100,
        caffeine_intake: Math.round((totals.caffeine_intake / totalEntries) * 100) / 100,
        alcohol_intake: Math.round((totals.alcohol_intake / totalEntries) * 100) / 100
      };
    }

    // Determine actual date range from results
    const sortedTrends = [...trends].sort((a, b) => a.date.localeCompare(b.date));
    const dateRange = {
      start: sortedTrends.length > 0 ? sortedTrends[0].date : (input.start_date || ''),
      end: sortedTrends.length > 0 ? sortedTrends[sortedTrends.length - 1].date : (input.end_date || '')
    };

    return {
      trends: trends.reverse(), // Return in chronological order for trend visualization
      averages,
      summary: {
        total_entries: totalEntries,
        date_range: dateRange
      }
    };
  } catch (error) {
    console.error('Failed to fetch wellness trends:', error);
    throw error;
  }
}
