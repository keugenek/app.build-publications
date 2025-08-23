import { db } from '../db';
import { classesTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteClass = async (id: number): Promise<void> => {
  try {
    // First delete all reservations associated with this class
    await db.delete(reservationsTable)
      .where(eq(reservationsTable.class_id, id))
      .execute();
    
    // Then delete the class itself
    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, id))
      .execute();
    
    // Check if any rows were affected
    if (result.rowCount === 0) {
      throw new Error(`Class with id ${id} not found`);
    }
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
};
