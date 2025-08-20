import { db } from '../db';
import { classesTable } from '../db/schema';
import { type GetClassByIdInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const getClassById = async (input: GetClassByIdInput): Promise<Class | null> => {
  try {
    const result = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const classData = result[0];
    return {
      id: classData.id,
      name: classData.name,
      description: classData.description,
      start_time: classData.start_time,
      end_time: classData.end_time,
      instructor_id: classData.instructor_id,
      max_capacity: classData.max_capacity,
      created_at: classData.created_at
    };
  } catch (error) {
    console.error('Failed to fetch class:', error);
    throw error;
  }
};
