import { db } from '../db';
import { catActivityLogsTable, catProfilesTable, dailyConspiracySummariesTable } from '../db/schema';
import { type LogCatActivityInput, type CatActivityLog } from '../schema';
import { eq, and } from 'drizzle-orm';

// Conspiracy points mapping for different cat activities
const ACTIVITY_CONSPIRACY_POINTS = {
    prolonged_staring: 15,           // Very suspicious - clearly planning something
    bringing_gifts: 25,              // Showing dominance and hunting prowess
    knocking_items: 10,              // Testing gravity or causing chaos
    sudden_zoomies: 8,               // Mysterious bursts of energy
    vocalizing_at_objects: 20,       // Communicating with unseen entities
    hiding_under_furniture: 12,      // Secret meetings or surveillance
    sitting_in_boxes: 5,             // Claiming territory or interdimensional travel
    midnight_meetings: 30,           // Peak conspiracy activity hours
    suspicious_purring: 18,          // Hypnotic mind control attempts
    ignoring_humans: 6               // Showing independence and superiority
} as const;

// Helper function to determine conspiracy level based on total points
const getConspiracyLevel = (totalPoints: number): 'innocent' | 'suspicious' | 'plotting' | 'dangerous' | 'world_domination' => {
    if (totalPoints <= 10) return 'innocent';
    if (totalPoints <= 30) return 'suspicious';
    if (totalPoints <= 60) return 'plotting';
    if (totalPoints <= 100) return 'dangerous';
    return 'world_domination';
};

export async function logCatActivity(input: LogCatActivityInput): Promise<CatActivityLog> {
    try {
        // Verify cat exists
        const catExists = await db.select()
            .from(catProfilesTable)
            .where(eq(catProfilesTable.id, input.cat_id))
            .execute();

        if (catExists.length === 0) {
            throw new Error(`Cat with ID ${input.cat_id} does not exist`);
        }

        const conspiracyPoints = ACTIVITY_CONSPIRACY_POINTS[input.activity_type];
        const occurredAt = input.occurred_at || new Date();
        const dateString = occurredAt.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Insert the activity log
        const activityResult = await db.insert(catActivityLogsTable)
            .values({
                cat_id: input.cat_id,
                activity_type: input.activity_type,
                description: input.description,
                conspiracy_points: conspiracyPoints,
                occurred_at: occurredAt
            })
            .returning()
            .execute();

        const newActivity = activityResult[0];

        // Update or create daily conspiracy summary
        const existingSummary = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, input.cat_id),
                eq(dailyConspiracySummariesTable.date, dateString)
            ))
            .execute();

        if (existingSummary.length > 0) {
            // Update existing summary
            const summary = existingSummary[0];
            const newTotalPoints = summary.total_conspiracy_points + conspiracyPoints;
            const newActivityCount = summary.activity_count + 1;
            const newConspiracyLevel = getConspiracyLevel(newTotalPoints);

            await db.update(dailyConspiracySummariesTable)
                .set({
                    total_conspiracy_points: newTotalPoints,
                    activity_count: newActivityCount,
                    conspiracy_level: newConspiracyLevel
                })
                .where(eq(dailyConspiracySummariesTable.id, summary.id))
                .execute();
        } else {
            // Create new summary
            const conspiracyLevel = getConspiracyLevel(conspiracyPoints);

            await db.insert(dailyConspiracySummariesTable)
                .values({
                    cat_id: input.cat_id,
                    date: dateString,
                    total_conspiracy_points: conspiracyPoints,
                    conspiracy_level: conspiracyLevel,
                    activity_count: 1
                })
                .execute();
        }

        return newActivity;
    } catch (error) {
        console.error('Cat activity logging failed:', error);
        throw error;
    }
}
