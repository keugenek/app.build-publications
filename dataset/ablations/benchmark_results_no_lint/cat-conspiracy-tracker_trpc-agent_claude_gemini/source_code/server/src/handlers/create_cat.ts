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
        age: input.age,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created cat
    const cat = result[0];
    return {
      ...cat,
      created_at: cat.created_at // Timestamp column - no conversion needed
    };
  } catch (error) {
    console.error('Cat creation failed:', error);
    throw error;
  }
};
