import { db } from '../db';
import { activitiesTable, catsTable } from '../db/schema';
import { type GetDailyConspiracyInput, type DailyConspiracyLevel } from '../schema';
import { eq, and, gte, lt, sum, count, sql, type SQL } from 'drizzle-orm';

// Helper function to determine conspiracy level based on total score
const getConspiracyLevel = (totalScore: number): string => {
  if (totalScore <= 5) return "Innocent Fluff Ball";
  if (totalScore <= 15) return "Mildly Suspicious";
  if (totalScore <= 25) return "Definitely Plotting Something";
  if (totalScore <= 35) return "Cat Conspiracy in Progress";
  return "Plotting World Domination";
};

export const getDailyConspiracyLevel = async (input: GetDailyConspiracyInput): Promise<DailyConspiracyLevel[]> => {
  try {
    // Parse the input date to create start and end of day timestamps
    const targetDate = new Date(input.date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by the target date
    conditions.push(gte(activitiesTable.recorded_at, startOfDay));
    conditions.push(lt(activitiesTable.recorded_at, endOfDay));

    // Optionally filter by specific cat
    if (input.cat_id !== undefined) {
      conditions.push(eq(activitiesTable.cat_id, input.cat_id));
    }

    // Build the query with proper aliases for aggregate functions
    let query = db.select({
      cat_id: activitiesTable.cat_id,
      cat_name: catsTable.name,
      total_conspiracy_score: sum(activitiesTable.conspiracy_score).mapWith(Number).as('total_conspiracy_score'),
      activity_count: count(activitiesTable.id).mapWith(Number).as('activity_count')
    })
    .from(activitiesTable)
    .innerJoin(catsTable, eq(activitiesTable.cat_id, catsTable.id))
    .where(and(...conditions))
    .groupBy(activitiesTable.cat_id, catsTable.name);

    const results = await query.execute();

    // Transform results and add conspiracy levels
    return results.map(result => ({
      date: input.date,
      cat_id: result.cat_id,
      cat_name: result.cat_name,
      total_conspiracy_score: result.total_conspiracy_score || 0,
      activity_count: result.activity_count || 0,
      conspiracy_level: getConspiracyLevel(result.total_conspiracy_score || 0)
    }));

  } catch (error) {
    console.error('Daily conspiracy level calculation failed:', error);
    throw error;
  }
};
