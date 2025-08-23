import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

export const getClasses = async (): Promise<Class[]> => {
  try {
    const results = await db.select()
      .from(classesTable)
      .execute();
    
    // Convert date fields and return classes
    return results.map(cls => ({
      ...cls,
      date: new Date(cls.date),
      created_at: new Date(cls.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
