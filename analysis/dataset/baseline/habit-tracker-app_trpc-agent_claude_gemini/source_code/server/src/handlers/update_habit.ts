import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput, type Habit } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHabit = async (input: UpdateHabitInput): Promise<Habit> => {
  try {
    // First, check if the habit exists
    const existingHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .execute();

    if (existingHabit.length === 0) {
      throw new Error(`Habit with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the habit record
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
