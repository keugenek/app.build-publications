import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';

describe('deleteHardwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test hardware asset
    await db.insert(hardwareAssetsTable).values({
      name: 'Test Laptop',
      type: 'Laptop',
      model: 'MacBook Pro',
      serialNumber: 'ABC123',
      location: 'Office 101'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing hardware asset', async () => {
    // First verify the asset exists
    const existingAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.name, 'Test Laptop'))
      .execute();
    
    expect(existingAssets).toHaveLength(1);
    const assetId = existingAssets[0].id;

    // Delete the asset
    const result = await deleteHardwareAsset(assetId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify the asset no longer exists
    const remainingAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, assetId))
      .execute();
    
    expect(remainingAssets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent hardware asset', async () => {
    // Try to delete an asset that doesn't exist
    const result = await deleteHardwareAsset(99999);
    
    // Should return false since no asset was deleted
    expect(result).toBe(false);
  });

  it('should return false for invalid ID', async () => {
    // Test with invalid input (negative ID)
    const result = await deleteHardwareAsset(-1);
    expect(result).toBe(false);
  });
});
