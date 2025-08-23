import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput, type Cat } from '../schema';

export const createCat = async (input: CreateCatInput): Promise<Cat> => {
  try {
    // Insert cat record
    const result = await db.insert(catsTable)
      .values({
        name: input.name,
        breed: input.breed,
        age: input.age
      })
      .returning()
      .execute();

    // Return the created cat
    return result[0];
  } catch (error) {
    console.error('Cat creation failed:', error);
    throw error;
  }
};
