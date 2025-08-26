import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type UpdateCollectionInput, type Collection } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCollection = async (input: UpdateCollectionInput): Promise<Collection | null> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      description: string | null;
      updated_at: Date;
    }> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update collection and return the updated record
    const result = await db.update(collectionsTable)
      .set(updateData)
      .where(eq(collectionsTable.id, input.id))
      .returning()
      .execute();

    // Return null if collection not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Collection update failed:', error);
    throw error;
  }
};
