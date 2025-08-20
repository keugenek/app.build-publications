import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

/**
 * Placeholder handler for fetching all gym classes.
 */
export const getClasses = async (): Promise<Class[]> => {
  // TODO: replace with real DB query
  return await db.select().from(classesTable).execute();
};
