import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCar = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the car record - cascading will automatically delete related records
    const result = await db.delete(carsTable)
      .where(eq(carsTable.id, id))
      .returning()
      .execute();

    // Return success true if a record was deleted, false if no record was found
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
};
