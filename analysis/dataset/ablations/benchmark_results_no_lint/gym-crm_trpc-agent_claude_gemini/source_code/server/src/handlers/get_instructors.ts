import { db } from '../db';
import { instructorsTable, usersTable } from '../db/schema';
import { type Instructor } from '../schema';
import { eq } from 'drizzle-orm';

export const getInstructors = async (): Promise<Instructor[]> => {
  try {
    // Fetch all instructors with their related user information
    const results = await db.select()
      .from(instructorsTable)
      .innerJoin(usersTable, eq(instructorsTable.user_id, usersTable.id))
      .execute();

    // Map the joined results to include user information in the instructor objects
    return results.map(result => ({
      id: result.instructors.id,
      user_id: result.instructors.user_id,
      specialization: result.instructors.specialization,
      bio: result.instructors.bio,
      created_at: result.instructors.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch instructors:', error);
    throw error;
  }
};
