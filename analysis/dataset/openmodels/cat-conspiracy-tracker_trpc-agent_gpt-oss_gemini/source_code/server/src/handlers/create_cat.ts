import { type CreateCatInput, type Cat } from '../schema';
import { db } from '../db';
import { catsTable } from '../db/schema';

// Implementation for creating a cat. Inserts into the database and returns the created record.
export const createCat = async (input: CreateCatInput): Promise<Cat> => {
  try {
    // Insert cat record; handle optional owner_name (null if undefined)
    const result = await db
      .insert(catsTable)
      .values({
        name: input.name,
        owner_name: input.owner_name ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns an array with the inserted rows.
    const cat = result[0];
    return cat as Cat;
  } catch (error) {
    console.error('Cat creation failed:', error);
    throw error;
  }
};
