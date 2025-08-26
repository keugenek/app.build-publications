import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdInput } from '../schema';

export const deleteHardwareAsset = async (input: IdInput): Promise<boolean> => {
  try {
    // Delete the hardware asset record
    const result = await db.delete(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, input.id))
      .execute();

    // Return true if at least one row was deleted, false otherwise
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Hardware asset deletion failed:', error);
    throw error;
  }
};
