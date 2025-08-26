import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing hardware asset', async () => {
    // First create a hardware asset to delete
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'ABC123XYZ',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Delete the hardware asset
    const result = await deleteHardwareAsset(assetId);

    expect(result).toBe(true);

    // Verify it's been deleted from the database
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent hardware asset', async () => {
    // Try to delete a hardware asset that doesn't exist
    const result = await deleteHardwareAsset(99999);

    expect(result).toBe(false);
  });

  it('should properly handle database errors', async () => {
    // Test with invalid ID type (though TypeScript would prevent this at compile time)
    await expect(deleteHardwareAsset(NaN)).rejects.toThrow();
  });
});
