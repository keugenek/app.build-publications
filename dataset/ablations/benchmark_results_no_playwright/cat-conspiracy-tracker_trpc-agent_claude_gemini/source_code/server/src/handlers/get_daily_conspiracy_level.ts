import { db } from '../db';
import { catsTable, suspiciousActivitiesTable, activityTypesTable } from '../db/schema';
import { type GetConspiracyLevelInput, type DailyConspiracyLevel } from '../schema';
import { eq, and, sum, count } from 'drizzle-orm';

export const getDailyConspiracyLevel = async (input: GetConspiracyLevelInput): Promise<DailyConspiracyLevel> => {
  try {
    // First, verify the cat exists and get cat name
    const catResult = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, input.cat_id))
      .execute();

    if (catResult.length === 0) {
      throw new Error(`Cat with ID ${input.cat_id} not found`);
    }

    const cat = catResult[0];

    // Query activities for the specific cat on the specific date
    // Join with activity types to get suspicion points
    const activitiesResult = await db.select({
      total_suspicion_points: sum(activityTypesTable.suspicion_points),
      activity_count: count(suspiciousActivitiesTable.id)
    })
    .from(suspiciousActivitiesTable)
    .innerJoin(activityTypesTable, eq(suspiciousActivitiesTable.activity_type_id, activityTypesTable.id))
    .where(and(
      eq(suspiciousActivitiesTable.cat_id, input.cat_id),
      eq(suspiciousActivitiesTable.activity_date, input.date)
    ))
    .execute();

    // Extract totals (sum and count return strings/nulls, need conversion)
    const totalSuspicionPoints = activitiesResult[0]?.total_suspicion_points 
      ? parseInt(activitiesResult[0].total_suspicion_points) 
      : 0;
    
    const activityCount = activitiesResult[0]?.activity_count 
      ? parseInt(activitiesResult[0].activity_count.toString()) 
      : 0;

    // Determine conspiracy level based on total suspicion points
    let conspiracyLevel: DailyConspiracyLevel['conspiracy_level'];
    if (totalSuspicionPoints >= 100) {
      conspiracyLevel = 'WORLD_DOMINATION';
    } else if (totalSuspicionPoints >= 51) {
      conspiracyLevel = 'EXTREME';
    } else if (totalSuspicionPoints >= 26) {
      conspiracyLevel = 'HIGH';
    } else if (totalSuspicionPoints >= 11) {
      conspiracyLevel = 'MODERATE';
    } else {
      conspiracyLevel = 'LOW';
    }

    return {
      cat_id: input.cat_id,
      cat_name: cat.name,
      date: input.date,
      total_suspicion_points: totalSuspicionPoints,
      activity_count: activityCount,
      conspiracy_level: conspiracyLevel
    };
  } catch (error) {
    console.error('Failed to get daily conspiracy level:', error);
    throw error;
  }
};
