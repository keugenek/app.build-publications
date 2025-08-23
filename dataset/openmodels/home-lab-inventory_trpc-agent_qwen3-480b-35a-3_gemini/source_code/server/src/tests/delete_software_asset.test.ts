import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing software asset', async () => {
    // First create a software asset to delete
    const newAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Software',
        type: 'Application',
        operatingSystem: 'Linux',
        host: 'server-01'
      })
      .returning()
      .execute();
    
    const assetId = newAsset[0].id;
    
    // Delete the software asset
    const result = await deleteSoftwareAsset(assetId);
    
    // Verify the deletion was successful
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
    
    // Verify the deletion was not successful
    expect(result).toBe(false);
  });

  it('should only delete the specified software asset', async () => {
    // Create multiple software assets
    const asset1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Software 1',
        type: 'Application',
        operatingSystem: 'Linux',
        host: 'server-01'
      })
      .returning()
      .execute();
    
    const asset2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Software 2',
        type: 'Database',
        operatingSystem: 'Windows',
        host: 'server-02'
      })
      .returning()
      .execute();
    
    // Delete only the first asset
    const result = await deleteSoftwareAsset(asset1[0].id);
    
    // Verify the deletion was successful
    expect(result).toBe(true);
    
    // Verify the first asset no longer exists
    const firstAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, asset1[0].id))
      .execute();
    
    expect(firstAsset).toHaveLength(0);
    
    // Verify the second asset still exists
    const secondAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, asset2[0].id))
      .execute();
    
    expect(secondAsset).toHaveLength(1);
    expect(secondAsset[0].name).toBe('Test Software 2');
  });
});
