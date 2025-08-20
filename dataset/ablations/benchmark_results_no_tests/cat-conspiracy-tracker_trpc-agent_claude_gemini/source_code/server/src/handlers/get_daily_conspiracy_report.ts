import { db } from '../db';
import { catProfilesTable, catActivityLogsTable } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { type GetDailySummaryInput, type DailyConspiracyReport, type ActivityWithPoints } from '../schema';

// Activity type to conspiracy points mapping
const ACTIVITY_CONSPIRACY_POINTS: Record<string, number> = {
  'prolonged_staring': 8,
  'bringing_gifts': 15,
  'knocking_items': 12,
  'sudden_zoomies': 6,
  'vocalizing_at_objects': 10,
  'hiding_under_furniture': 9,
  'sitting_in_boxes': 4,
  'midnight_meetings': 20,
  'suspicious_purring': 7,
  'ignoring_humans': 5
};

// Conspiracy level thresholds and descriptions
const CONSPIRACY_THRESHOLDS = {
  innocent: 0,      // 0-10 points
  suspicious: 11,   // 11-30 points
  plotting: 31,     // 31-60 points
  dangerous: 61,    // 61-100 points
  world_domination: 101 // 101+ points
};

const getConspiracyLevel = (totalPoints: number): 'innocent' | 'suspicious' | 'plotting' | 'dangerous' | 'world_domination' => {
  if (totalPoints >= CONSPIRACY_THRESHOLDS.world_domination) return 'world_domination';
  if (totalPoints >= CONSPIRACY_THRESHOLDS.dangerous) return 'dangerous';
  if (totalPoints >= CONSPIRACY_THRESHOLDS.plotting) return 'plotting';
  if (totalPoints >= CONSPIRACY_THRESHOLDS.suspicious) return 'suspicious';
  return 'innocent';
};

const getConspiracyLevelDescription = (level: string): string => {
  const descriptions = {
    innocent: "Your cat appears to be behaving normally today. But don't let your guard down...",
    suspicious: "Some questionable activities detected. Keep an eye on your feline friend.",
    plotting: "Definite signs of conspiracy! Your cat is planning something significant.",
    dangerous: "High alert! Your cat is actively engaged in suspicious operations.",
    world_domination: "MAXIMUM THREAT LEVEL! Your cat has clearly begun their plan for world domination!"
  };
  return descriptions[level as keyof typeof descriptions] || "Unknown threat level";
};

export async function getDailyConspiracyReport(input: GetDailySummaryInput): Promise<DailyConspiracyReport> {
  try {
    // 1. Fetch the cat's profile information
    const catProfiles = await db.select()
      .from(catProfilesTable)
      .where(eq(catProfilesTable.id, input.cat_id))
      .execute();

    if (catProfiles.length === 0) {
      throw new Error(`Cat with ID ${input.cat_id} not found`);
    }

    const catProfile = catProfiles[0];

    // 2. Get all activities for the specified date
    // Parse the input date and create start/end timestamps for the day
    const startDate = new Date(`${input.date}T00:00:00.000Z`);
    const endDate = new Date(`${input.date}T23:59:59.999Z`);

    const activities = await db.select()
      .from(catActivityLogsTable)
      .where(
        and(
          eq(catActivityLogsTable.cat_id, input.cat_id),
          gte(catActivityLogsTable.occurred_at, startDate),
          lte(catActivityLogsTable.occurred_at, endDate)
        )
      )
      .execute();

    // 3. Calculate conspiracy points for each activity and total
    const activitiesWithPoints: ActivityWithPoints[] = activities.map(activity => {
      const conspiracyPoints = ACTIVITY_CONSPIRACY_POINTS[activity.activity_type] || 0;
      
      return {
        id: activity.id,
        cat_id: activity.cat_id,
        activity_type: activity.activity_type as any,
        description: activity.description,
        conspiracy_points: conspiracyPoints,
        occurred_at: activity.occurred_at,
        logged_at: activity.logged_at
      };
    });

    const totalConspiracyPoints = activitiesWithPoints.reduce(
      (total, activity) => total + activity.conspiracy_points,
      0
    );

    // 4. Determine conspiracy level based on points
    const conspiracyLevel = getConspiracyLevel(totalConspiracyPoints);

    // 5. Return formatted report with activities and level description
    return {
      cat_name: catProfile.name,
      date: input.date,
      total_conspiracy_points: totalConspiracyPoints,
      conspiracy_level: conspiracyLevel,
      activities: activitiesWithPoints,
      level_description: getConspiracyLevelDescription(conspiracyLevel)
    };
  } catch (error) {
    console.error('Daily conspiracy report generation failed:', error);
    throw error;
  }
}
