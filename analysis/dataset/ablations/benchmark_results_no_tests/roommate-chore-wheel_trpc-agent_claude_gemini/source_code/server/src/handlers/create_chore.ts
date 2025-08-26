import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput, type Chore } from '../schema';

// Helper function to get the start of the current week (Monday)
const getWeekStart = (date: Date = new Date()): Date => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0); // Reset time to start of day
  return start;
};

export const createChore = async (input: CreateChoreInput): Promise<Chore> => {
  try {
    // Get the start of the current week for assignment
    const weekStart = getWeekStart();
    
    // Insert chore record
    const result = await db.insert(choresTable)
      .values({
        name: input.name,
        is_completed: false, // Default to not completed
        assigned_date: weekStart // Assign to current week
      })
      .returning()
      .execute();

    const chore = result[0];
    return {
      id: chore.id,
      name: chore.name,
      is_completed: chore.is_completed,
      assigned_date: chore.assigned_date!,
      created_at: chore.created_at!
    };
  } catch (error) {
    console.error('Chore creation failed:', error);
    throw error;
  }
};
