import { db } from '../db';
import { choresTable, assignmentsTable } from '../db/schema';
import { type DeleteChoreInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteChore = async (input: DeleteChoreInput): Promise<{ success: boolean }> => {
  try {
    // First, delete any assignments that reference this chore
    await db.delete(assignmentsTable)
      .where(eq(assignmentsTable.chore_id, input.id))
      .execute();

    // Then delete the chore itself
    const result = await db.delete(choresTable)
      .where(eq(choresTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Chore deletion failed:', error);
    throw error;
  }
};
