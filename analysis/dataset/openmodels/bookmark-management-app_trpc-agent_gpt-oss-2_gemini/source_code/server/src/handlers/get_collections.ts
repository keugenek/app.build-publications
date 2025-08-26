import { db } from '../db';
import { collections } from '../db/schema';
import { type Collection } from '../schema';

/** Fetch all collections of the current user. */
export const getCollections = async (): Promise<Collection[]> => {
  try {
    const rows = await db.select().from(collections).execute();
    return rows;
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw error;
  }
};
