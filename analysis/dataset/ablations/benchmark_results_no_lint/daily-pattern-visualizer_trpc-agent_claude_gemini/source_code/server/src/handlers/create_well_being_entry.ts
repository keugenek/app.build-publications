import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type CreateWellBeingEntryInput, type WellBeingEntry } from '../schema';
import { eq } from 'drizzle-orm';

export async function createWellBeingEntry(input: CreateWellBeingEntryInput): Promise<WellBeingEntry> {
  try {
    // Check if an entry already exists for this date to prevent duplicates
    const existingEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.date, input.date.toISOString().split('T')[0])) // Convert Date to YYYY-MM-DD format
      .limit(1)
      .execute();

    if (existingEntry.length > 0) {
      throw new Error(`Well-being entry already exists for date ${input.date.toISOString().split('T')[0]}`);
    }

    // Insert new well-being entry
    const result = await db.insert(wellBeingEntriesTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Store date as YYYY-MM-DD string
        sleep_hours: input.sleep_hours, // real column - no conversion needed
        work_hours: input.work_hours, // real column - no conversion needed
        social_time_hours: input.social_time_hours, // real column - no conversion needed
        screen_time_hours: input.screen_time_hours, // real column - no conversion needed
        emotional_energy_level: input.emotional_energy_level // integer column - no conversion needed
      })
      .returning()
      .execute();

    const entry = result[0];
    
    // Convert date string back to Date object for consistency with schema
    return {
      ...entry,
      date: new Date(entry.date)
    };
  } catch (error) {
    console.error('Well-being entry creation failed:', error);
    throw error;
  }
}
