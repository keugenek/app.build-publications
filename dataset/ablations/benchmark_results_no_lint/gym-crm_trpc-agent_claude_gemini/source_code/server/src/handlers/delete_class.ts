import { db } from '../db';
import { classesTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteClass(input: DeleteEntityInput): Promise<{ success: boolean }> {
  try {
    // Delete the class - cascade deletion will handle bookings and attendance records
    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    // Check if the class was actually deleted
    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
}
