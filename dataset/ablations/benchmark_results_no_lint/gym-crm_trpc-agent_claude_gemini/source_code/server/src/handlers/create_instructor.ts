import { db } from '../db';
import { instructorsTable, usersTable } from '../db/schema';
import { type CreateInstructorInput, type Instructor } from '../schema';
import { eq } from 'drizzle-orm';

export const createInstructor = async (input: CreateInstructorInput): Promise<Instructor> => {
  try {
    // Validate that the user exists and has instructor role
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    if (user[0].role !== 'instructor') {
      throw new Error('User must have instructor role to create instructor profile');
    }

    // Check if instructor profile already exists for this user
    const existingInstructor = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.user_id, input.user_id))
      .execute();

    if (existingInstructor.length > 0) {
      throw new Error('Instructor profile already exists for this user');
    }

    // Insert instructor record
    const result = await db.insert(instructorsTable)
      .values({
        user_id: input.user_id,
        specialization: input.specialization || null,
        bio: input.bio || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Instructor creation failed:', error);
    throw error;
  }
};
