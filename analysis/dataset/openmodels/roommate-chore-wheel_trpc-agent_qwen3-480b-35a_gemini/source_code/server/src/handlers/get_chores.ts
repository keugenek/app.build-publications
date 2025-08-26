import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';

export const getChores = async (): Promise<Chore[]> => {
  try {
    const results = await db.select()
      .from(choresTable)
      .execute();

    return results.map(chore => ({
      ...chore,
      created_at: chore.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    throw error;
  }
};
