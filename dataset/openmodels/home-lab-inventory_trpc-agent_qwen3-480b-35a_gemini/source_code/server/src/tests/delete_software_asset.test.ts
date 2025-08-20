import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';
import { eq } from 'drizzle-orm';

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing software asset', async () => {
    // First create a software asset to delete
    const createdSoftwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        host_id: 1,
        operating_system: 'Ubuntu 20.04',
        description: 'Test virtual machine'
      })
      .returning()
      .execute();
    
    const assetId = createdSoftwareAsset[0].id;
    
    // Delete the software asset
    const result = await deleteSoftwareAsset(assetId);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify the asset no longer exists in the database
    const assets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, assetId))
      .execute();
    
    expect(assets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent software asset', async () => {
    // Try to delete a software asset that doesn't exist
    const result = await deleteSoftwareAsset(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });

  it('should handle deletion of software asset with null description', async () => {
    // Create a software asset with null description
    const createdSoftwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Container',
        type: 'Container',
        host_id: 2,
        operating_system: 'Alpine Linux',
        description: null
      })
      .returning()
      .execute();
    
    const assetId = createdSoftwareAsset[0].id;
    
    // Delete the software asset
    const result = await deleteSoftwareAsset(assetId);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify the asset no longer exists in the database
    const assets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, assetId))
      .execute();
    
    expect(assets).toHaveLength(0);
  });
});
