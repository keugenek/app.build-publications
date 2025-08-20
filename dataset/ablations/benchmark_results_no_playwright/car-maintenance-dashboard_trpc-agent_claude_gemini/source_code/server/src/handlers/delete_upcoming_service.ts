import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type DeleteRecordInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteUpcomingService = async (input: DeleteRecordInput): Promise<{ success: boolean }> => {
  try {
    // Delete the upcoming service record
    const result = await db
      .delete(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, input.id))
      .returning()
      .execute();

    // Check if a record was actually deleted
    if (result.length === 0) {
      throw new Error(`Upcoming service with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Upcoming service deletion failed:', error);
    throw error;
  }
};
