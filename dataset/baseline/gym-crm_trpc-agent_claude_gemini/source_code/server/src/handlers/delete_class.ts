import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteClass = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if class exists
    const existingClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .execute();

    if (existingClass.length === 0) {
      throw new Error(`Class with id ${id} not found`);
    }

    // Check if there are any schedules associated with this class
    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.class_id, id))
      .execute();

    if (schedules.length > 0) {
      // Soft delete - set is_active to false
      await db.update(classesTable)
        .set({ 
          is_active: false,
          updated_at: new Date()
        })
        .where(eq(classesTable.id, id))
        .execute();
    } else {
      // Hard delete - no schedules exist
      await db.delete(classesTable)
        .where(eq(classesTable.id, id))
        .execute();
    }

    return { success: true };
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
};
