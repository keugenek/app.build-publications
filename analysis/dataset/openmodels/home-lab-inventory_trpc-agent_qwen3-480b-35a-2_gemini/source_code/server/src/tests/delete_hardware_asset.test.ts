import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { createHardwareAssetInputSchema, createSoftwareAssetInputSchema, createIpAddressInputSchema } from '../schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a hardware asset', async () => {
    // Create a test hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server'
      })
      .returning()
      .execute();

    const assetId = hardwareAsset[0].id;

    // Delete the hardware asset
    const result = await deleteHardwareAsset(assetId);

    expect(result).toBe(true);

    // Verify it's been deleted
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent hardware asset', async () => {
    const result = await deleteHardwareAsset(99999);
    expect(result).toBe(false);
  });

  it('should not delete a hardware asset with dependent software assets', async () => {
    // Create a hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        description: 'A host server'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareAsset[0].id;

    // Create a software asset that depends on the hardware asset
    await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'A test VM',
        host_id: hardwareAssetId
      })
      .execute();

    // Try to delete the hardware asset - should fail
    await expect(deleteHardwareAsset(hardwareAssetId))
      .rejects
      .toThrow(/dependent software assets/);

    // Verify the hardware asset still exists
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAssetId))
      .execute();

    expect(assets).toHaveLength(1);
  });

  it('should not delete a hardware asset with assigned IP addresses', async () => {
    // Create a hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Network Switch',
        type: 'switch',
        description: 'A network switch'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareAsset[0].id;

    // Create an IP address assigned to the hardware asset
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        status: 'allocated',
        hardware_asset_id: hardwareAssetId,
        software_asset_id: null
      })
      .execute();

    // Try to delete the hardware asset - should fail
    await expect(deleteHardwareAsset(hardwareAssetId))
      .rejects
      .toThrow(/assigned IP addresses/);

    // Verify the hardware asset still exists
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAssetId))
      .execute();

    expect(assets).toHaveLength(1);
  });
});
