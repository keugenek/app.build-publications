import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput, type Habit } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHabit = async (input: UpdateHabitInput): Promise<Habit> => {
  try {
    // First check if the habit exists
    const existingHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .execute();
      
    if (existingHabit.length === 0) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    // Build the update values object dynamically based on provided fields
    const updateValues: Partial<typeof habitsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    // Update habit record
    const result = await db.update(habitsTable)
      .set(updateValues)
      .where(eq(habitsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update habit with id ${input.id}`);
    }

    const updatedHabit = result[0];
    
    // Convert to the expected Habit type
    return {
      id: updatedHabit.id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      created_at: updatedHabit.created_at
    };
  } catch (error) {
    console.error('Habit update failed:', error);
    throw error;
  }
};
