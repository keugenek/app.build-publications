import { type DailyConspiracy } from '../schema';

import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { sql } from 'drizzle-orm';

// Calculate daily conspiracy levels by aggregating suspicion scores per cat per day.
// Returns an array of objects containing cat_id, date (activity_date), and total_score as a number.
export const getDailyConspiracy = async (): Promise<DailyConspiracy[]> => {
  try {
    // Build aggregation query
    const results = await db
      .select({
        cat_id: activitiesTable.cat_id,
        date: activitiesTable.activity_date,
        total_score: sql<number>`SUM(${activitiesTable.suspicion_score})`
      })
      .from(activitiesTable)
      .groupBy(activitiesTable.cat_id, activitiesTable.activity_date)
      .execute();

    // Convert numeric string to number for total_score (numeric column returns string)
    return results.map(row => ({
      cat_id: row.cat_id,
      // Convert date string (or Date) to Date object
      date: new Date(row.date as any),
      total_score: parseFloat((row.total_score as unknown as string))
    }));
  } catch (error) {
    console.error('Failed to calculate daily conspiracy:', error);
    throw error;
  }
};
// Placeholder removed
