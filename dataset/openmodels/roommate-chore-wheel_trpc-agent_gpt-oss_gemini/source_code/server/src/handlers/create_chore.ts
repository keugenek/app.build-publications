import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput, type Chore } from '../schema';

/**
 * Handler for creating a chore.
 * Inserts the chore into the database and returns the created record with proper type conversions.
 */
export const createChore = async (input: CreateChoreInput): Promise<Chore> => {
  try {
    const result = await db
      .insert(choresTable)
      .values({
        title: input.title,
        description: input.description ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns rows where timestamp columns are Date objects already.
    // No numeric conversion needed for this table.
    return result[0];
  } catch (error) {
    console.error('Chore creation failed:', error);
    // Rethrow to allow caller to handle the error.
    throw error;
  }
};
