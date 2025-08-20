import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { type CheckInHabitInput, type HabitCheckIn } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function checkInHabit(input: CheckInHabitInput): Promise<HabitCheckIn> {
  try {
    const completedAt = input.completed_at || new Date();
    
    // 1. Verify the habit exists
    const existingHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();
    
    if (existingHabit.length === 0) {
      throw new Error(`Habit with id ${input.habit_id} does not exist`);
    }

    // 2. Check if there's already a check-in for the specified date (prevent duplicates)
    // Compare dates by checking if any check-in exists for the same calendar day
    const targetDateStr = completedAt.toDateString();
    
    const existingCheckIns = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, input.habit_id))
      .execute();
    
    const existingCheckIn = existingCheckIns.find(checkIn => 
      checkIn.completed_at.toDateString() === targetDateStr
    );
    
    if (existingCheckIn) {
      throw new Error(`Check-in already exists for habit ${input.habit_id} on ${completedAt.toDateString()}`);
    }

    // 3. Create a new check-in record
    const result = await db.insert(habitCheckInsTable)
      .values({
        habit_id: input.habit_id,
        completed_at: completedAt
      })
      .returning()
      .execute();

    // 4. Return the created check-in
    return result[0];
  } catch (error) {
    console.error('Habit check-in failed:', error);
    throw error;
  }
}
