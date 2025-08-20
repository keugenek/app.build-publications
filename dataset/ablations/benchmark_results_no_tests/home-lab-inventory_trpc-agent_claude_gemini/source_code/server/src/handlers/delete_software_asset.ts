import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteSoftwareAsset = async (input: IdInput): Promise<boolean> => {
  try {
    const result = await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
};
