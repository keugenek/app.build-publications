import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

describe('updateHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test hardware asset
  const createTestAsset = async () => {
    const testInput: CreateHardwareAssetInput = {
      name: 'Original Asset',
      type: 'server',
      make: 'Dell',
      model: 'PowerEdge',
      serial_number: 'SN123456',
      description: 'Original description'
    };

    const result = await db.insert(hardwareAssetsTable)
      .values({
        ...testInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update all fields of a hardware asset', async () => {
    const asset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      name: 'Updated Asset',
      type: 'workstation',
      make: 'HP',
      model: 'EliteDesk',
      serial_number: 'SN654321',
      description: 'Updated description'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(asset.id);
    expect(result.name).toEqual('Updated Asset');
    expect(result.type).toEqual('workstation');
    expect(result.make).toEqual('HP');
    expect(result.model).toEqual('EliteDesk');
    expect(result.serial_number).toEqual('SN654321');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(asset.created_at);
    expect(result.updated_at).not.toEqual(asset.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const asset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      name: 'Partially Updated Asset',
      description: 'New description only'
    };

    const result = await updateHardwareAsset(updateInput);

    // Updated fields
    expect(result.name).toEqual('Partially Updated Asset');
    expect(result.description).toEqual('New description only');
    
    // Unchanged fields
    expect(result.type).toEqual(asset.type);
    expect(result.make).toEqual(asset.make);
    expect(result.model).toEqual(asset.model);
    expect(result.serial_number).toEqual(asset.serial_number);
    
    // Timestamps
    expect(result.created_at).toEqual(asset.created_at);
    expect(result.updated_at).not.toEqual(asset.updated_at);
  });

  it('should handle nullable fields correctly', async () => {
    const asset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      serial_number: null,
      description: null
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.serial_number).toBeNull();
    expect(result.description).toBeNull();
    expect(result.name).toEqual(asset.name); // Unchanged
    expect(result.type).toEqual(asset.type); // Unchanged
  });

  it('should update the asset in the database', async () => {
    const asset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      name: 'Database Updated Asset'
    };

    await updateHardwareAsset(updateInput);

    // Verify the change persisted in the database
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, asset.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Updated Asset');
    expect(assets[0].type).toEqual(asset.type); // Unchanged
    expect(assets[0].updated_at).not.toEqual(asset.updated_at);
  });

  it('should throw error when hardware asset does not exist', async () => {
    const updateInput: UpdateHardwareAssetInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Asset'
    };

    await expect(updateHardwareAsset(updateInput))
      .rejects
      .toThrow(/Hardware asset with id 999999 not found/i);
  });

  it('should preserve existing values when updating with undefined fields', async () => {
    const asset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      name: 'Only Name Updated'
      // All other fields are undefined, should preserve existing values
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.name).toEqual('Only Name Updated');
    expect(result.type).toEqual(asset.type);
    expect(result.make).toEqual(asset.make);
    expect(result.model).toEqual(asset.model);
    expect(result.serial_number).toEqual(asset.serial_number);
    expect(result.description).toEqual(asset.description);
  });

  it('should update timestamp correctly', async () => {
    const asset = await createTestAsset();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateHardwareAssetInput = {
      id: asset.id,
      name: 'Timestamp Test Asset'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.created_at).toEqual(asset.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(asset.updated_at.getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
