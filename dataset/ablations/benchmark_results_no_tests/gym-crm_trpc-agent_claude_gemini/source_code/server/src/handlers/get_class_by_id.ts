import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Class } from '../schema';

export async function getClassById(classId: number): Promise<Class | null> {
  try {
    const result = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const classData = result[0];
    
    return {
      ...classData,
      class_date: new Date(classData.class_date)
    };
  } catch (error) {
    console.error('Failed to get class by ID:', error);
    throw error;
  }
}
