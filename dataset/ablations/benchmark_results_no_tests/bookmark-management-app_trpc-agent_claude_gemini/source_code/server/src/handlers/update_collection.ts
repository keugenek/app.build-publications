import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type UpdateCollectionInput, type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCollection = async (input: UpdateCollectionInput): Promise<Collection | null> => {
  try {
    // First check if the collection exists
    const existingCollection = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, input.id))
      .execute();

    if (existingCollection.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof collectionsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Perform the update
    const result = await db.update(collectionsTable)
      .set(updateData)
      .where(eq(collectionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Collection update failed:', error);
    throw error;
  }
};
