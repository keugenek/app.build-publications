import { db } from '../db';
import { classesTable, instructorsTable } from '../db/schema';
import { type Class } from '../schema';
import { desc, gte, eq } from 'drizzle-orm';

export const getClasses = async (): Promise<Class[]> => {
  try {
    const results = await db.select()
      .from(classesTable)
      .innerJoin(instructorsTable, eq(classesTable.instructor_id, instructorsTable.id))
      .orderBy(desc(classesTable.date))
      .execute();

    return results.map(result => ({
      id: result.classes.id,
      name: result.classes.name,
      description: result.classes.description,
      date: result.classes.date,
      duration_minutes: result.classes.duration_minutes,
      instructor_id: result.classes.instructor_id,
      capacity: result.classes.capacity,
      created_at: result.classes.created_at
    }));
  } catch (error) {
    console.error('Get classes failed:', error);
    throw error;
  }
};

export const getUpcomingClasses = async (): Promise<Class[]> => {
  try {
    const now = new Date();
    
    const results = await db.select()
      .from(classesTable)
      .innerJoin(instructorsTable, eq(classesTable.instructor_id, instructorsTable.id))
      .where(gte(classesTable.date, now))
      .orderBy(desc(classesTable.date))
      .execute();

    return results.map(result => ({
      id: result.classes.id,
      name: result.classes.name,
      description: result.classes.description,
      date: result.classes.date,
      duration_minutes: result.classes.duration_minutes,
      instructor_id: result.classes.instructor_id,
      capacity: result.classes.capacity,
      created_at: result.classes.created_at
    }));
  } catch (error) {
    console.error('Get upcoming classes failed:', error);
    throw error;
  }
};
