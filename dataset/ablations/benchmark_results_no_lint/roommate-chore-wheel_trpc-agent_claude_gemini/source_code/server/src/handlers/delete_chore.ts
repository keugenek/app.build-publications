import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteChore(choreId: number): Promise<void> {
  try {
    // First, delete all weekly assignments associated with this chore
    // This prevents foreign key constraint violations
    await db.delete(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.chore_id, choreId))
      .execute();

    // Then delete the chore itself
    const result = await db.delete(choresTable)
      .where(eq(choresTable.id, choreId))
      .returning({ id: choresTable.id })
      .execute();

    // Check if chore was found and deleted
    if (result.length === 0) {
      throw new Error(`Chore with id ${choreId} not found`);
    }
  } catch (error) {
    console.error('Chore deletion failed:', error);
    throw error;
  }
}
