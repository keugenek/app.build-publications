import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteHardwareAsset = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
};
