import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type UpdateWellBeingEntryInput, type WellBeingEntry } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateWellBeingEntry(input: UpdateWellBeingEntryInput): Promise<WellBeingEntry> {
  try {
    // First, check if the entry exists
    const existingEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Well-being entry with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.date !== undefined) {
      updateData.date = input.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    }
    
    if (input.sleep_hours !== undefined) {
      updateData.sleep_hours = input.sleep_hours;
    }
    
    if (input.work_hours !== undefined) {
      updateData.work_hours = input.work_hours;
    }
    
    if (input.social_time_hours !== undefined) {
      updateData.social_time_hours = input.social_time_hours;
    }
    
    if (input.screen_time_hours !== undefined) {
      updateData.screen_time_hours = input.screen_time_hours;
    }
    
    if (input.emotional_energy_level !== undefined) {
      updateData.emotional_energy_level = input.emotional_energy_level;
    }

    // Perform the update and return the updated record
    const result = await db.update(wellBeingEntriesTable)
      .set(updateData)
      .where(eq(wellBeingEntriesTable.id, input.id))
      .returning()
      .execute();

    // Convert the database result back to proper types
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date), // Convert date string back to Date object
      sleep_hours: Number(updatedEntry.sleep_hours), // Ensure numeric type
      work_hours: Number(updatedEntry.work_hours),
      social_time_hours: Number(updatedEntry.social_time_hours),
      screen_time_hours: Number(updatedEntry.screen_time_hours)
    };
  } catch (error) {
    console.error('Well-being entry update failed:', error);
    throw error;
  }
}
