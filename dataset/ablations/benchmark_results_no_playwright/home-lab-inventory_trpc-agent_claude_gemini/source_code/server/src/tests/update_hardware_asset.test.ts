import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

describe('updateHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test hardware asset
  const createTestAsset = async () => {
    const result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Original Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Original description'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update all fields of a hardware asset', async () => {
    const originalAsset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: originalAsset.id,
      name: 'Updated Server',
      type: 'Storage Server',
      manufacturer: 'HPE',
      model: 'ProLiant DL380',
      description: 'Updated description'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(originalAsset.id);
    expect(result.name).toEqual('Updated Server');
    expect(result.type).toEqual('Storage Server');
    expect(result.manufacturer).toEqual('HPE');
    expect(result.model).toEqual('ProLiant DL380');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(originalAsset.created_at);
    expect(result.updated_at).not.toEqual(originalAsset.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const originalAsset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: originalAsset.id,
      name: 'Partially Updated Server',
      manufacturer: 'Lenovo'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(originalAsset.id);
    expect(result.name).toEqual('Partially Updated Server');
    expect(result.type).toEqual(originalAsset.type); // Should remain unchanged
    expect(result.manufacturer).toEqual('Lenovo');
    expect(result.model).toEqual(originalAsset.model); // Should remain unchanged
    expect(result.description).toEqual(originalAsset.description); // Should remain unchanged
    expect(result.created_at).toEqual(originalAsset.created_at);
    expect(result.updated_at).not.toEqual(originalAsset.updated_at);
  });

  it('should update description to null', async () => {
    const originalAsset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: originalAsset.id,
      description: null
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual(originalAsset.name); // Other fields unchanged
    expect(result.updated_at).not.toEqual(originalAsset.updated_at);
  });

  it('should persist changes in database', async () => {
    const originalAsset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: originalAsset.id,
      name: 'Database Updated Server',
      type: 'Web Server'
    };

    await updateHardwareAsset(updateInput);

    // Verify changes are persisted in database
    const updatedAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, originalAsset.id))
      .execute();

    expect(updatedAssets).toHaveLength(1);
    expect(updatedAssets[0].name).toEqual('Database Updated Server');
    expect(updatedAssets[0].type).toEqual('Web Server');
    expect(updatedAssets[0].manufacturer).toEqual(originalAsset.manufacturer);
    expect(updatedAssets[0].updated_at).not.toEqual(originalAsset.updated_at);
  });

  it('should throw error when hardware asset does not exist', async () => {
    const updateInput: UpdateHardwareAssetInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Asset'
    };

    await expect(updateHardwareAsset(updateInput)).rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should handle empty updates gracefully', async () => {
    const originalAsset = await createTestAsset();
    
    const updateInput: UpdateHardwareAssetInput = {
      id: originalAsset.id
      // No fields to update except ID
    };

    const result = await updateHardwareAsset(updateInput);

    // All original fields should remain the same except updated_at
    expect(result.id).toEqual(originalAsset.id);
    expect(result.name).toEqual(originalAsset.name);
    expect(result.type).toEqual(originalAsset.type);
    expect(result.manufacturer).toEqual(originalAsset.manufacturer);
    expect(result.model).toEqual(originalAsset.model);
    expect(result.description).toEqual(originalAsset.description);
    expect(result.created_at).toEqual(originalAsset.created_at);
    expect(result.updated_at).not.toEqual(originalAsset.updated_at);
  });

  it('should handle updating multiple assets independently', async () => {
    // Create two test assets
    const asset1 = await createTestAsset();
    const asset2 = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Second Server',
        type: 'Database Server',
        manufacturer: 'IBM',
        model: 'System x3650',
        description: 'Second server description'
      })
      .returning()
      .execute();

    // Update first asset
    const update1: UpdateHardwareAssetInput = {
      id: asset1.id,
      name: 'Updated First Server'
    };

    // Update second asset
    const update2: UpdateHardwareAssetInput = {
      id: asset2[0].id,
      manufacturer: 'Updated IBM'
    };

    const result1 = await updateHardwareAsset(update1);
    const result2 = await updateHardwareAsset(update2);

    // Verify first asset update
    expect(result1.name).toEqual('Updated First Server');
    expect(result1.manufacturer).toEqual(asset1.manufacturer); // Unchanged

    // Verify second asset update
    expect(result2.name).toEqual(asset2[0].name); // Unchanged
    expect(result2.manufacturer).toEqual('Updated IBM');

    // Verify independence - first asset should not be affected by second update
    expect(result1.id).not.toEqual(result2.id);
  });
});
