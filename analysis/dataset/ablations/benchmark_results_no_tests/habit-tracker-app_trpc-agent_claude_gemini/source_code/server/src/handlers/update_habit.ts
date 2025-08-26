import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type UpdateHabitInput, type Habit } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateHabit(input: UpdateHabitInput): Promise<Habit> {
  try {
    // Build the update object with only the fields that are provided
    const updateData: { name?: string; description?: string | null } = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // If no fields to update, just return the existing habit
    if (Object.keys(updateData).length === 0) {
      const existing = await db.select()
        .from(habitsTable)
        .where(eq(habitsTable.id, input.id))
        .execute();
      
      if (existing.length === 0) {
        throw new Error(`Habit with id ${input.id} not found`);
      }
      
      return existing[0];
    }

    // Update the habit record
    const result = await db.update(habitsTable)
      .set(updateData)
      .where(eq(habitsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Habit update failed:', error);
    throw error;
  }
}
