import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';

export const getChores = async (): Promise<Chore[]> => {
  try {
    const chores = await db.select().from(choresTable).execute();
    return chores.map(chore => ({
      ...chore,
      created_at: new Date(chore.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    throw error;
  }
};
