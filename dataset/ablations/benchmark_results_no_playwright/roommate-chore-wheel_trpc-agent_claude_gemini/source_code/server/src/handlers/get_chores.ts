import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';

export const getChores = async (): Promise<Chore[]> => {
  try {
    const result = await db.select()
      .from(choresTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    throw error;
  }
};
