import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type GetUserEntityInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCollections(input: GetUserEntityInput): Promise<Collection[]> {
  try {
    // Query collections for the specified user
    const results = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, input.user_id))
      .execute();

    // Return the collections (no numeric conversions needed for this schema)
    return results;
  } catch (error) {
    console.error('Get collections failed:', error);
    throw error;
  }
}
