import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateWellnessEntry = async (input: UpdateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // First, get the existing entry to get any missing values
    const [existingEntry] = await db.select().from(wellnessEntriesTable).where(eq(wellnessEntriesTable.id, input.id)).execute();
    
    if (!existingEntry) {
      throw new Error(`Wellness entry with id ${input.id} not found`);
    }
    
    // Prepare updated values
    const updatedValues: any = {
      ...existingEntry,
      ...input,
      updated_at: new Date(), // Keep as Date object
    };
    
    // Handle date conversion if provided
    if (input.date) {
      updatedValues.date = input.date.toISOString().split('T')[0]; // Convert Date to string in YYYY-MM-DD format
    }
    
    // Recalculate wellness score based on updated data
    // Convert values to numbers for calculation if they're strings
    const sleepHours = typeof updatedValues.sleep_hours === 'string' 
      ? parseFloat(updatedValues.sleep_hours) 
      : updatedValues.sleep_hours;
    const stressLevel = updatedValues.stress_level;
    const caffeineIntake = updatedValues.caffeine_intake;
    const alcoholIntake = updatedValues.alcohol_intake;
    
    const sleepScore = Math.min(10, (sleepHours / 24) * 10);
    const stressScore = 11 - stressLevel; // 1-10 becomes 10-1
    const caffeineScore = Math.max(0, 10 - caffeineIntake);
    const alcoholScore = Math.max(0, 10 - alcoholIntake);
    
    const wellnessScore = (sleepScore + stressScore + caffeineScore + alcoholScore) / 4;
    updatedValues.wellness_score = wellnessScore.toString(); // Convert to string for numeric field
    
    // Update the wellness entry in the database
    const [updatedEntry] = await db.update(wellnessEntriesTable)
      .set(updatedValues)
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();
    
    // Convert string values back to numbers for the return object
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date), // Convert string back to Date
      sleep_hours: parseFloat(updatedEntry.sleep_hours as string),
      wellness_score: parseFloat(updatedEntry.wellness_score as string),
    } as WellnessEntry;
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
};
