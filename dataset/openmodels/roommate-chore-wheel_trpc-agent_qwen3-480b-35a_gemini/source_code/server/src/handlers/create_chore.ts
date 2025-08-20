import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput, type Chore } from '../schema';

export const createChore = async (input: CreateChoreInput): Promise<Chore> => {
  try {
    // Insert chore record
    const result = await db.insert(choresTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    const chore = result[0];
    return {
      ...chore,
      created_at: new Date(chore.created_at)
    };
  } catch (error) {
    console.error('Chore creation failed:', error);
    throw error;
  }
};
