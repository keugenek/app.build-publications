import { db } from '../db';
import { instructorsTable } from '../db/schema';
import { type CreateInstructorInput, type Instructor } from '../schema';

export const createInstructor = async (input: CreateInstructorInput): Promise<Instructor> => {
  try {
    // Insert instructor record
    const result = await db.insert(instructorsTable)
      .values({
        name: input.name,
        email: input.email
      })
      .returning()
      .execute();

    const instructor = result[0];
    return {
      ...instructor
    };
  } catch (error) {
    console.error('Instructor creation failed:', error);
    throw error;
  }
};
