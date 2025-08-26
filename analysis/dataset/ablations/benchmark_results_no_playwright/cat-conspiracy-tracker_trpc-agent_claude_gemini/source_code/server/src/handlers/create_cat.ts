import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput, type Cat } from '../schema';

export const createCat = async (input: CreateCatInput): Promise<Cat> => {
  try {
    // Insert cat record
    const result = await db.insert(catsTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    const cat = result[0];
    return cat;
  } catch (error) {
    console.error('Cat creation failed:', error);
    throw error;
  }
};
