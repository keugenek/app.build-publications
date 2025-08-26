import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type ConspiracyLevel } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodaysConspiracyLevel = async (): Promise<ConspiracyLevel> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate date comparison
    
    // Format date as YYYY-MM-DD string for database comparison
    const todayString = today.toISOString().split('T')[0];

    // Query activities for today
    const activities = await db.select({
      suspicion_score: activitiesTable.suspicion_score
    })
    .from(activitiesTable)
    .where(eq(activitiesTable.date, todayString))
    .execute();

    // Sum up all suspicion scores
    const totalSuspicionScore = activities.reduce(
      (sum, activity) => sum + activity.suspicion_score,
      0
    );

    return {
      date: today,
      total_suspicion_score: totalSuspicionScore
    };
  } catch (error) {
    console.error('Failed to calculate today\'s conspiracy level:', error);
    throw error;
  }
};
