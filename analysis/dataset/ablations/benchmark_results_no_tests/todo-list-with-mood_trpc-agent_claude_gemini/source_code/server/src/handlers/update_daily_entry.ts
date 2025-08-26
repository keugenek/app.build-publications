import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type UpdateDailyEntryInput, type DailyEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDailyEntry = async (input: UpdateDailyEntryInput): Promise<DailyEntry> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.mood !== undefined) {
      updateData.mood = input.mood;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the daily entry
    const result = await db.update(dailyEntriesTable)
      .set(updateData)
      .where(eq(dailyEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Daily entry with id ${input.id} not found`);
    }

    // Convert date string to Date object for return type
    const dailyEntry = result[0];
    return {
      ...dailyEntry,
      date: new Date(dailyEntry.date)
    };
  } catch (error) {
    console.error('Daily entry update failed:', error);
    throw error;
  }
};
