import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput, type Habit } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHabit = async (input: UpdateHabitInput): Promise<Habit> => {
  try {
    // First check if habit exists
    const existingHabits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .execute();

    if (existingHabits.length === 0) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // If no fields to update, return existing habit
    if (Object.keys(updateData).length === 0) {
      return existingHabits[0];
    }

    // Update the habit
    const result = await db.update(habitsTable)
      .set(updateData)
      .where(eq(habitsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Habit update failed:', error);
    throw error;
  }
};
