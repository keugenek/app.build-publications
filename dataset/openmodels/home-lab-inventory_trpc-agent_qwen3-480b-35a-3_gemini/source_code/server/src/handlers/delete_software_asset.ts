import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteSoftwareAsset = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, id))
      .returning()
      .execute();
    
    // If no rows were deleted, the asset didn't exist
    return result.length > 0;
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
};
