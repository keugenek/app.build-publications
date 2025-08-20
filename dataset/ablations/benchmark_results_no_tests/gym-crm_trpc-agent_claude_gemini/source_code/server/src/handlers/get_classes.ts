import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export interface GetClassesFilters {
  start_date?: Date;
  end_date?: Date;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructor_name?: string;
}

export const getClasses = async (filters?: GetClassesFilters): Promise<Class[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.start_date) {
      conditions.push(gte(classesTable.class_date, filters.start_date.toISOString().split('T')[0]));
    }

    if (filters?.end_date) {
      conditions.push(lte(classesTable.class_date, filters.end_date.toISOString().split('T')[0]));
    }

    if (filters?.status) {
      conditions.push(eq(classesTable.status, filters.status));
    }

    if (filters?.instructor_name) {
      conditions.push(eq(classesTable.instructor_name, filters.instructor_name));
    }

    // Execute query with proper condition handling
    const results = conditions.length > 0
      ? await db.select()
          .from(classesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(classesTable.class_date), desc(classesTable.start_time))
          .execute()
      : await db.select()
          .from(classesTable)
          .orderBy(desc(classesTable.class_date), desc(classesTable.start_time))
          .execute();

    // Convert the results to match the Class schema
    return results.map(classRecord => ({
      ...classRecord,
      class_date: new Date(classRecord.class_date),
      created_at: classRecord.created_at,
      updated_at: classRecord.updated_at
    }));
  } catch (error) {
    console.error('Get classes failed:', error);
    throw error;
  }
};
