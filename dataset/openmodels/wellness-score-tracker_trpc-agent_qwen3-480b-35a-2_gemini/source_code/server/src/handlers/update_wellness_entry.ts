import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWellnessEntry = async (input: UpdateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // Calculate wellness score based on inputs
    // This is a simplified formula - in a real application, this would be more complex
    const calculateWellnessScore = (
      sleepHours: number,
      stressLevel: number,
      caffeineIntake: number,
      alcoholIntake: number
    ): number => {
      // Base score (0-100)
      let score = 50;
      
      // Sleep contribution (7-9 hours is optimal)
      if (sleepHours >= 7 && sleepHours <= 9) {
        score += 20;
      } else if (sleepHours >= 6 && sleepHours <= 10) {
        score += 10;
      }
      
      // Stress reduction (lower stress is better)
      score -= (stressLevel - 1) * 2; // Subtract 0-18 points based on stress
      
      // Caffeine penalty (more than 2 servings is not ideal)
      if (caffeineIntake > 2) {
        score -= (caffeineIntake - 2) * 2;
      }
      
      // Alcohol penalty (any alcohol is not ideal)
      score -= alcoholIntake * 3;
      
      // Ensure score stays within bounds
      return Math.max(0, Math.min(100, score));
    };

    // Prepare update values
    const updateValues: any = {
      updated_at: new Date()
    };

    // Fetch current entry to get existing values for calculation
    const existingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    if (existingEntries.length === 0) {
      throw new Error(`Wellness entry with id ${input.id} not found`);
    }

    const existingEntry = existingEntries[0];

    // Set values for update if provided in input, otherwise use existing values
    const sleepHours = input.sleep_hours ?? parseFloat(existingEntry.sleep_hours);
    const stressLevel = input.stress_level ?? existingEntry.stress_level;
    const caffeineIntake = input.caffeine_intake ?? parseFloat(existingEntry.caffeine_intake);
    const alcoholIntake = input.alcohol_intake ?? parseFloat(existingEntry.alcohol_intake);
    
    // For date, we need to handle the case where it might be a string from the database
    let dateValue: Date | string = existingEntry.date;
    if (input.date !== undefined) {
      dateValue = input.date;
    }

    // Update provided fields
    if (input.date !== undefined) {
      updateValues.date = dateValue;
    }
    
    if (input.sleep_hours !== undefined) {
      updateValues.sleep_hours = sleepHours.toString();
    }
    
    if (input.stress_level !== undefined) {
      updateValues.stress_level = stressLevel;
    }
    
    if (input.caffeine_intake !== undefined) {
      updateValues.caffeine_intake = caffeineIntake.toString();
    }
    
    if (input.alcohol_intake !== undefined) {
      updateValues.alcohol_intake = alcoholIntake.toString();
    }

    // Calculate new wellness score
    const wellnessScore = calculateWellnessScore(
      sleepHours,
      stressLevel,
      caffeineIntake,
      alcoholIntake
    );
    
    updateValues.wellness_score = wellnessScore.toString();

    // Update the wellness entry
    const result = await db.update(wellnessEntriesTable)
      .set(updateValues)
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update wellness entry with id ${input.id}`);
    }

    // Convert numeric fields back to numbers before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date), // Convert string date back to Date object
      sleep_hours: parseFloat(updatedEntry.sleep_hours),
      stress_level: updatedEntry.stress_level,
      caffeine_intake: parseFloat(updatedEntry.caffeine_intake),
      alcohol_intake: parseFloat(updatedEntry.alcohol_intake),
      wellness_score: parseFloat(updatedEntry.wellness_score),
      created_at: updatedEntry.created_at,
      updated_at: updatedEntry.updated_at
    };
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
};
