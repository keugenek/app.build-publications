import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Class } from '../schema';

export interface GetClassesOptions {
  includeInactive?: boolean;
}

export const getClasses = async (options: GetClassesOptions = {}): Promise<Class[]> => {
  try {
    // Build query with proper type handling
    const results = options.includeInactive 
      ? await db.select().from(classesTable).execute()
      : await db.select().from(classesTable).where(eq(classesTable.is_active, true)).execute();

    // Convert numeric fields back to numbers for the response
    return results.map(classData => ({
      ...classData,
      price: parseFloat(classData.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
