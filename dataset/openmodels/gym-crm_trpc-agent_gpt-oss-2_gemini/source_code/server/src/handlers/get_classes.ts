import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

// Fetch all classes from the database
export const getClasses = async (): Promise<Class[]> => {
  try {
    const rows = await db.select().from(classesTable).execute();
    return rows.map(row => ({
      ...row,
      // Ensure date is a Date instance (Postgres date may come as string)
      date: new Date(row.date as any),
      // Trim time to HH:mm format (Postgres time includes seconds)
      time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
