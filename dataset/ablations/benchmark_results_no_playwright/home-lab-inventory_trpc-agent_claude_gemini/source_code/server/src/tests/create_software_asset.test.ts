import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM',
  description: 'A virtual machine for testing',
  hardware_asset_id: null
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset without hardware reference', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test VM');
    expect(result.type).toEqual('VM');
    expect(result.description).toEqual('A virtual machine for testing');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save software asset to database', async () => {
    const result = await createSoftwareAsset(testInput);

    // Query using proper drizzle syntax
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Test VM');
    expect(softwareAssets[0].type).toEqual('VM');
    expect(softwareAssets[0].description).toEqual('A virtual machine for testing');
    expect(softwareAssets[0].hardware_asset_id).toBeNull();
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(softwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create software asset with hardware reference', async () => {
    // First create a hardware asset to reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Physical server for hosting VMs'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    const inputWithHardware: CreateSoftwareAssetInput = {
      name: 'Database VM',
      type: 'VM',
      description: 'Database virtual machine',
      hardware_asset_id: hardwareAsset.id
    };

    const result = await createSoftwareAsset(inputWithHardware);

    expect(result.name).toEqual('Database VM');
    expect(result.type).toEqual('VM');
    expect(result.description).toEqual('Database virtual machine');
    expect(result.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(result.id).toBeDefined();
  });

  it('should throw error for non-existent hardware asset reference', async () => {
    const inputWithInvalidHardware: CreateSoftwareAssetInput = {
      name: 'Invalid VM',
      type: 'VM',
      description: 'VM with invalid hardware reference',
      hardware_asset_id: 99999 // Non-existent hardware asset ID
    };

    await expect(createSoftwareAsset(inputWithInvalidHardware))
      .rejects.toThrow(/Hardware asset with ID 99999 does not exist/i);
  });

  it('should create software asset with null description', async () => {
    const inputWithNullDescription: CreateSoftwareAssetInput = {
      name: 'Container Service',
      type: 'Container',
      description: null,
      hardware_asset_id: null
    };

    const result = await createSoftwareAsset(inputWithNullDescription);

    expect(result.name).toEqual('Container Service');
    expect(result.type).toEqual('Container');
    expect(result.description).toBeNull();
    expect(result.hardware_asset_id).toBeNull();
  });

  it('should create multiple software assets on same hardware', async () => {
    // Create hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380',
        description: 'Multi-purpose server'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create first software asset
    const firstInput: CreateSoftwareAssetInput = {
      name: 'Web Server VM',
      type: 'VM',
      description: 'Web application server',
      hardware_asset_id: hardwareAsset.id
    };

    const firstResult = await createSoftwareAsset(firstInput);

    // Create second software asset on same hardware
    const secondInput: CreateSoftwareAssetInput = {
      name: 'Database VM',
      type: 'VM',
      description: 'Database server',
      hardware_asset_id: hardwareAsset.id
    };

    const secondResult = await createSoftwareAsset(secondInput);

    // Both should reference the same hardware
    expect(firstResult.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(secondResult.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(firstResult.id).not.toEqual(secondResult.id);

    // Verify both exist in database
    const allSoftware = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.hardware_asset_id, hardwareAsset.id))
      .execute();

    expect(allSoftware).toHaveLength(2);
  });
});
