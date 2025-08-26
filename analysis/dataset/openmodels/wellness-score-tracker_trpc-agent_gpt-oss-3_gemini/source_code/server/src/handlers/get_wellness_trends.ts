import { sql } from 'drizzle-orm';
import { type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';

/**
 * Compute average wellness score per day.
 * Returns an array of objects containing the date (YYYY-MM-DD) and the average score for that date.
 */
export async function getWellnessTrends(): Promise<{ date: string; averageScore: number }[]> {
  // Build expressions for date extraction and average calculation
  const dateExpr = sql<string>`date(${wellnessEntriesTable.created_at})`;
  const avgScoreExpr = sql<string>`AVG(${wellnessEntriesTable.wellness_score})`;

  // Execute query grouping by the date expression
  const rows = await db
    .select({
      date: dateExpr,
      averageScore: avgScoreExpr,
    })
    .from(wellnessEntriesTable)
    .groupBy(dateExpr)
    .orderBy(dateExpr)
    .execute();

  // Convert the numeric average (returned as string) to a number
  return rows.map((row) => ({
    date: row.date,
    averageScore: parseFloat(row.averageScore as unknown as string),
  }));
}
