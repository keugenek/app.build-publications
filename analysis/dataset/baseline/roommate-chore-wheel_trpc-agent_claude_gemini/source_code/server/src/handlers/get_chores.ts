import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';

export const getChores = async (): Promise<Chore[]> => {
  try {
    const results = await db.select()
      .from(choresTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get chores:', error);
    throw error;
  }
};
