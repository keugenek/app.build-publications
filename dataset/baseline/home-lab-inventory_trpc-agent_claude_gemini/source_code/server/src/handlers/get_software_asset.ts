import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type SoftwareAsset, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSoftwareAsset(params: IdParam): Promise<SoftwareAsset | null> {
  try {
    // Query software asset with optional join to hardware asset (host)
    const results = await db.select()
      .from(softwareAssetsTable)
      .leftJoin(
        hardwareAssetsTable,
        eq(softwareAssetsTable.host_id, hardwareAssetsTable.id)
      )
      .where(eq(softwareAssetsTable.id, params.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract software asset data from joined result
    const result = results[0];
    const softwareAsset = result.software_assets;

    return {
      ...softwareAsset,
      created_at: new Date(softwareAsset.created_at),
      updated_at: new Date(softwareAsset.updated_at)
    };
  } catch (error) {
    console.error('Failed to get software asset:', error);
    throw error;
  }
}
