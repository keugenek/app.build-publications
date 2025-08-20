import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { type ActivityType } from '../schema';
import { eq } from 'drizzle-orm';

export async function seedDefaultActivities(): Promise<ActivityType[]> {
    try {
        const defaultActivities = [
            { name: 'Prolonged Staring', description: 'Cat stares intensely at nothing visible to humans', suspicion_points: 5 },
            { name: 'Leaving Dead Insect Gifts', description: 'Strategically placing deceased insects as offerings or warnings', suspicion_points: 8 },
            { name: 'Knocking Items Off Shelves', description: 'Deliberately pushing objects to test gravity or assert dominance', suspicion_points: 6 },
            { name: 'Sudden Inexplicable Zoomies', description: 'Bursts of chaotic running with no apparent trigger', suspicion_points: 4 },
            { name: 'Suspicious Purring While Being Petted', description: 'Purring that seems too calculated and manipulative', suspicion_points: 3 },
            { name: 'Deliberately Ignoring Commands', description: 'Pretending not to hear when called, clearly planning something', suspicion_points: 7 },
            { name: '3 AM Vocalizations', description: 'Mysterious yowling or chattering at ungodly hours', suspicion_points: 9 },
            { name: 'Hiding in Cardboard Boxes', description: 'Setting up surveillance posts in shipping containers', suspicion_points: 5 },
            { name: 'Bringing Live Prey Indoors', description: 'Delivering still-moving creatures as psychological warfare', suspicion_points: 12 },
            { name: 'Sitting on Important Documents', description: 'Strategically positioning to obstruct human productivity', suspicion_points: 4 }
        ];

        const seededActivities: ActivityType[] = [];

        for (const activity of defaultActivities) {
            // Check if activity already exists to avoid duplicates
            const existingActivity = await db.select()
                .from(activityTypesTable)
                .where(eq(activityTypesTable.name, activity.name))
                .limit(1)
                .execute();

            if (existingActivity.length === 0) {
                // Activity doesn't exist, insert it
                const result = await db.insert(activityTypesTable)
                    .values({
                        name: activity.name,
                        description: activity.description,
                        suspicion_points: activity.suspicion_points
                    })
                    .returning()
                    .execute();

                seededActivities.push(result[0]);
            } else {
                // Activity already exists, add it to the results
                seededActivities.push(existingActivity[0]);
            }
        }

        return seededActivities;
    } catch (error) {
        console.error('Failed to seed default activities:', error);
        throw error;
    }
}
