import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type BehaviorType } from '../schema';
import { eq } from 'drizzle-orm';

const DEFAULT_BEHAVIOR_TYPES = [
  { name: 'Prolonged Staring', conspiracy_score: 7 },
  { name: 'Gifts of Dead Insects', conspiracy_score: 9 },
  { name: 'Sudden Zoomies', conspiracy_score: 5 },
  { name: 'Mysterious Whispers', conspiracy_score: 8 },
  { name: 'Doorway Obstruction', conspiracy_score: 6 },
  { name: '3 AM Shenanigans', conspiracy_score: 10 },
  { name: 'Suspicious Knocking', conspiracy_score: 8 },
  { name: 'Invisible Hunting', conspiracy_score: 4 }
];

export async function seedDefaultBehaviorTypes(): Promise<BehaviorType[]> {
  try {
    const results: BehaviorType[] = [];

    for (const behaviorType of DEFAULT_BEHAVIOR_TYPES) {
      // Check if the behavior type already exists
      const existing = await db.select()
        .from(behaviorTypesTable)
        .where(eq(behaviorTypesTable.name, behaviorType.name))
        .execute();

      if (existing.length === 0) {
        // Create the behavior type if it doesn't exist
        const result = await db.insert(behaviorTypesTable)
          .values({
            name: behaviorType.name,
            conspiracy_score: behaviorType.conspiracy_score,
            is_custom: false // Default types are not custom
          })
          .returning()
          .execute();

        results.push(result[0]);
      } else {
        // Return existing behavior type
        results.push(existing[0]);
      }
    }

    return results;
  } catch (error) {
    console.error('Default behavior types seeding failed:', error);
    throw error;
  }
}
