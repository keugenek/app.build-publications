import { db } from '../db';
import { instructorsTable } from '../db/schema';
import { type Instructor } from '../schema';

export const getInstructors = async (): Promise<Instructor[]> => {
  try {
    const results = await db.select()
      .from(instructorsTable)
      .execute();

    return results.map(instructor => ({
      ...instructor,
      created_at: new Date(instructor.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch instructors:', error);
    throw error;
  }
};
