import { type DailyConspiracy, type Activity } from '../schema';
import { db } from '../db';
import { activitiesTable } from '../db/schema';

/**
 * Handler to compute daily conspiracy level.
 * It queries the `activities` table, groups activities by date, sums the points,
 * and returns a detailed daily summary.
 */
export const getDailyConspiracy = async (): Promise<DailyConspiracy[]> => {
  try {
    // Fetch all activities
    const activities = await db.select().from(activitiesTable).execute();

    // Group activities by date (YYYY-MM-DD)
    const groups: Record<string, { date: Date; totalPoints: number; activities: Activity[] }> = {};
    for (const act of activities) {
      const dateKey = act.created_at.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(dateKey), // Date at midnight UTC
          totalPoints: 0,
          activities: [],
        };
      }
      groups[dateKey].activities.push({
        id: act.id,
        type: act.type,
        points: act.points,
        created_at: act.created_at,
      });
      groups[dateKey].totalPoints += act.points;
    }

    // Convert groups to array and sort by date ascending
    const result: DailyConspiracy[] = Object.values(groups)
      .map((g) => ({
        date: g.date,
        totalPoints: g.totalPoints,
        activities: g.activities,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  } catch (error) {
    console.error('Failed to get daily conspiracy:', error);
    throw error;
  }
};
