import { db } from '../db';
import { serviceSchedulesTable } from '../db/schema';
import { type DeleteServiceScheduleInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteServiceSchedule = async (input: DeleteServiceScheduleInput): Promise<{ success: boolean }> => {
  try {
    // Delete the service schedule by ID
    const result = await db.delete(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Service schedule deletion failed:', error);
    throw error;
  }
};
