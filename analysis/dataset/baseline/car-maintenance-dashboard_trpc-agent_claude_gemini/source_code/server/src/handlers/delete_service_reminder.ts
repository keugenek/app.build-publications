import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteServiceReminder = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the service reminder record
    const result = await db.delete(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, id))
      .returning({ id: serviceRemindersTable.id })
      .execute();

    // Return success status based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Service reminder deletion failed:', error);
    throw error;
  }
};
