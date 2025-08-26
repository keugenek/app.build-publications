import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

describe('updateSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let hardwareAssetId: number;
  let softwareAssetId: number;

  beforeEach(async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R730',
        description: 'Test hardware for software assets'
      })
      .returning()
      .execute();
    hardwareAssetId = hardwareResult[0].id;

    // Create test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Original Software',
        type: 'VM',
        description: 'Original description',
        hardware_asset_id: hardwareAssetId
      })
      .returning()
      .execute();
    softwareAssetId = softwareResult[0].id;
  });

  it('should update all fields of a software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      name: 'Updated Software',
      type: 'Container',
      description: 'Updated description',
      hardware_asset_id: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.id).toEqual(softwareAssetId);
    expect(result.name).toEqual('Updated Software');
    expect(result.type).toEqual('Container');
    expect(result.description).toEqual('Updated description');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      name: 'Partially Updated Software'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.name).toEqual('Partially Updated Software');
    expect(result.type).toEqual('VM'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.hardware_asset_id).toEqual(hardwareAssetId); // Should remain unchanged
  });

  it('should update hardware_asset_id to a different valid ID', async () => {
    // Create another hardware asset
    const anotherHardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Another Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380',
        description: 'Another test hardware'
      })
      .returning()
      .execute();

    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      hardware_asset_id: anotherHardwareResult[0].id
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.hardware_asset_id).toEqual(anotherHardwareResult[0].id);
  });

  it('should update description to null', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      description: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.description).toBeNull();
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      name: 'Database Persisted Software',
      type: 'Service'
    };

    await updateSoftwareAsset(updateInput);

    // Verify changes are persisted
    const persisted = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAssetId))
      .execute();

    expect(persisted).toHaveLength(1);
    expect(persisted[0].name).toEqual('Database Persisted Software');
    expect(persisted[0].type).toEqual('Service');
    expect(persisted[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalSoftware = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAssetId))
      .execute();

    const originalUpdatedAt = originalSoftware[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      name: 'Timestamp Test Software'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when software asset does not exist', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 99999,
      name: 'Non-existent Software'
    };

    await expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/software asset with id 99999 not found/i);
  });

  it('should throw error when hardware_asset_id references non-existent hardware', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      hardware_asset_id: 99999
    };

    await expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should handle hardware_asset_id set to null', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAssetId,
      hardware_asset_id: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.hardware_asset_id).toBeNull();

    // Verify in database
    const persisted = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAssetId))
      .execute();

    expect(persisted[0].hardware_asset_id).toBeNull();
  });
});
