import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput, type Chore } from '../schema';

// Handler for creating a chore
export const createChore = async (input: CreateChoreInput): Promise<Chore> => {
  try {
    const result = await db
      .insert(choresTable)
      .values({
        name: input.name,
        description: input.description ?? null,
      })
      .returning()
      .execute();

    // The DB returns an array with the inserted row
    const chore = result[0];
    return {
      ...chore,
    } as Chore;
  } catch (error) {
    console.error('Chore creation failed:', error);
    throw error;
  }
};

// Handler for fetching all chores
export const getChores = async (): Promise<Chore[]> => {
  try {
    const chores = await db.select().from(choresTable).execute();
    return chores as Chore[];
  } catch (error) {
    console.error('Fetching chores failed:', error);
    throw error;
  }
};

