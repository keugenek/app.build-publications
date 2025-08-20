import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput } from '../schema';

export async function deleteServiceReminder(input: DeleteByIdInput): Promise<boolean> {
  try {
    // Delete the service reminder by ID
    const result = await db.delete(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, input.id))
      .returning()
      .execute();

    // Return true if a reminder was deleted, false if no reminder was found
    return result.length > 0;
  } catch (error) {
    console.error('Service reminder deletion failed:', error);
    throw error;
  }
}
