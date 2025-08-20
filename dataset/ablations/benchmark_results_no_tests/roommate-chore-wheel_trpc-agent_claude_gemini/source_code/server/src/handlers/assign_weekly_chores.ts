import { db } from '../db';
import { choresTable } from '../db/schema';
import { type AssignWeeklyChoresInput, type Chore } from '../schema';
import { sql } from 'drizzle-orm';

export async function assignWeeklyChores(input: AssignWeeklyChoresInput): Promise<Chore[]> {
  try {
    // 1. Get all unique chore names (templates) from existing chores
    const uniqueChoreNames = await db
      .selectDistinct({ name: choresTable.name })
      .from(choresTable)
      .execute();

    if (uniqueChoreNames.length === 0) {
      return [];
    }

    // 2. Randomly shuffle the chore names
    const shuffledChores = [...uniqueChoreNames].sort(() => Math.random() - 0.5);

    // 3. Create new chore records for the specified week
    const choresToInsert = shuffledChores.map(chore => ({
      name: chore.name,
      is_completed: false,
      assigned_date: input.week_start_date
    }));

    const result = await db.insert(choresTable)
      .values(choresToInsert)
      .returning()
      .execute();

    // 4. Return the newly created chore assignments
    return result;
  } catch (error) {
    console.error('Weekly chore assignment failed:', error);
    throw error;
  }
}
