import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

// Wellness score calculation algorithm (same as create handler)
function calculateWellnessScore(
  sleepHours: number,
  stressLevel: number,
  caffeineIntake: number,
  alcoholIntake: number
): number {
  // Sleep score: optimal 7-9 hours, penalty for too little or too much
  const sleepScore = Math.max(0, 100 - Math.abs(8 - sleepHours) * 10);
  
  // Stress score: lower stress is better (invert the 1-10 scale)
  const stressScore = (11 - stressLevel) * 10;
  
  // Caffeine penalty: moderate amounts okay, high amounts penalized
  const caffeineScore = Math.max(0, 100 - Math.max(0, caffeineIntake - 200) * 0.1);
  
  // Alcohol penalty: any alcohol reduces score
  const alcoholScore = Math.max(0, 100 - alcoholIntake * 20);
  
  // Weighted average of all factors
  const totalScore = (sleepScore * 0.3 + stressScore * 0.3 + caffeineScore * 0.2 + alcoholScore * 0.2);
  
  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

export const updateWellnessEntry = async (input: UpdateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // First, fetch the current entry to check if it exists and get current values
    const existingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    if (existingEntries.length === 0) {
      throw new Error(`Wellness entry with id ${input.id} not found`);
    }

    const currentEntry = existingEntries[0];

    // Use updated values or fall back to current values
    const updatedSleepHours = input.sleep_hours ?? parseFloat(currentEntry.sleep_hours);
    const updatedStressLevel = input.stress_level ?? currentEntry.stress_level;
    const updatedCaffeineIntake = input.caffeine_intake ?? parseFloat(currentEntry.caffeine_intake);
    const updatedAlcoholIntake = input.alcohol_intake ?? parseFloat(currentEntry.alcohol_intake);

    // Recalculate wellness score with updated values
    const wellnessScore = calculateWellnessScore(
      updatedSleepHours,
      updatedStressLevel,
      updatedCaffeineIntake,
      updatedAlcoholIntake
    );

    // Build update object with only fields that need updating
    const updateData: any = {
      wellness_score: wellnessScore.toString(),
      updated_at: new Date()
    };

    if (input.sleep_hours !== undefined) {
      updateData.sleep_hours = input.sleep_hours.toString();
    }
    if (input.stress_level !== undefined) {
      updateData.stress_level = input.stress_level;
    }
    if (input.caffeine_intake !== undefined) {
      updateData.caffeine_intake = input.caffeine_intake.toString();
    }
    if (input.alcohol_intake !== undefined) {
      updateData.alcohol_intake = input.alcohol_intake.toString();
    }

    // Update the entry in the database
    const result = await db.update(wellnessEntriesTable)
      .set(updateData)
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and handle date conversion
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date),
      sleep_hours: parseFloat(updatedEntry.sleep_hours),
      caffeine_intake: parseFloat(updatedEntry.caffeine_intake),
      alcohol_intake: parseFloat(updatedEntry.alcohol_intake),
      wellness_score: parseFloat(updatedEntry.wellness_score)
    };
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
};
