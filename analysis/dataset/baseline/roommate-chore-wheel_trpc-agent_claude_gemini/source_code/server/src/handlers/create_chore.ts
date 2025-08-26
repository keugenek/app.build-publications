import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput, type Chore } from '../schema';

export const createChore = async (input: CreateChoreInput): Promise<Chore> => {
  try {
    // Insert chore record
    const result = await db.insert(choresTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chore creation failed:', error);
    throw error;
  }
};
