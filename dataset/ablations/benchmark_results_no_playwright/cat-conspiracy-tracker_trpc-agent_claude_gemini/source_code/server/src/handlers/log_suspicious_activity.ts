import { db } from '../db';
import { suspiciousActivitiesTable, catsTable, activityTypesTable } from '../db/schema';
import { type LogSuspiciousActivityInput, type SuspiciousActivity } from '../schema';
import { eq } from 'drizzle-orm';

export async function logSuspiciousActivity(input: LogSuspiciousActivityInput): Promise<SuspiciousActivity> {
  try {
    // Verify that the cat exists
    const catExists = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, input.cat_id))
      .execute();

    if (catExists.length === 0) {
      throw new Error(`Cat with ID ${input.cat_id} not found`);
    }

    // Verify that the activity type exists
    const activityTypeExists = await db.select()
      .from(activityTypesTable)
      .where(eq(activityTypesTable.id, input.activity_type_id))
      .execute();

    if (activityTypeExists.length === 0) {
      throw new Error(`Activity type with ID ${input.activity_type_id} not found`);
    }

    // Insert the suspicious activity record
    const result = await db.insert(suspiciousActivitiesTable)
      .values({
        cat_id: input.cat_id,
        activity_type_id: input.activity_type_id,
        notes: input.notes,
        activity_date: input.activity_date
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Suspicious activity logging failed:', error);
    throw error;
  }
}
