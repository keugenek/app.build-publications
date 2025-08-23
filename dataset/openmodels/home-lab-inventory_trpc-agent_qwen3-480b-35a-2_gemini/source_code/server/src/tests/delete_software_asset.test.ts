import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';

describe('deleteSoftwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first as software asset requires a host
    await db.insert(hardwareAssetsTable).values({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing software asset', async () => {
    // First create a software asset to delete
    const hardwareAssets = await db.select().from(hardwareAssetsTable).execute();
    const hostId = hardwareAssets[0].id;
    
    const result = await db.insert(softwareAssetsTable).values({
      name: 'Test VM',
      type: 'VM',
      description: 'A test VM',
      host_id: hostId
    }).returning().execute();

    const softwareAsset = result[0];

    // Delete the software asset
    const deleteResult = await deleteSoftwareAsset(softwareAsset.id);

    // Verify deletion was successful
    expect(deleteResult).toBe(true);

    // Verify the software asset no longer exists in the database
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(softwareAssets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent software asset', async () => {
    // Try to delete a software asset that doesn't exist
    const result = await deleteSoftwareAsset(99999);

    // Should return false as no record was deleted
    expect(result).toBe(false);
  });
});
