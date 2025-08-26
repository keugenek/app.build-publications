import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset, type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getSoftwareAsset = async (input: DeleteInput): Promise<SoftwareAsset | null> => {
  try {
    const result = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get software asset:', error);
    throw error;
  }
};
