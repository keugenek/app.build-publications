import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type IdInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSoftwareAsset(input: IdInput): Promise<SoftwareAsset | null> {
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
    console.error('Failed to fetch software asset:', error);
    throw error;
  }
}
