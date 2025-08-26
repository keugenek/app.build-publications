import { db } from '../db';
import { collections } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Collection } from '../schema';

/** Delete a collection by its ID and return the deleted record. */
export const deleteCollection = async (id: number): Promise<Collection> => {
  try {
    const result = await db
      .delete(collections)
      .where(eq(collections.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Collection with id ${id} not found`);
    }

    return result[0] as Collection;
  } catch (error) {
    console.error('Collection deletion failed:', error);
    throw error;
  }
};
