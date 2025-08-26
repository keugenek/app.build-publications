import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type UpdateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a hardware asset
const createTestInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'Server',
  make: 'Dell',
  model: 'PowerEdge R740',
  serial_number: 'SN123456789',
  description: 'Test server for updating'
};

// Test input for updating
const updateTestInput: UpdateHardwareAssetInput = {
  id: 1,
  name: 'Updated Server',
  type: 'Storage',
  make: 'HP',
  model: 'StorageServer 2000',
  serial_number: 'SN987654321',
  description: 'Updated test server'
};

describe('updateHardwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test hardware asset to update
    await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a hardware asset with all fields', async () => {
    const result = await updateHardwareAsset(updateTestInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Server');
    expect(result.type).toEqual('Storage');
    expect(result.make).toEqual('HP');
    expect(result.model).toEqual('StorageServer 2000');
    expect(result.serial_number).toEqual('SN987654321');
    expect(result.description).toEqual('Updated test server');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields of a hardware asset', async () => {
    // Update only the name and description
    const partialUpdate: UpdateHardwareAssetInput = {
      id: 1,
      name: 'Partially Updated Server',
      description: 'Partially updated server description'
    };

    const result = await updateHardwareAsset(partialUpdate);

    // Should update only the specified fields
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Partially Updated Server');
    expect(result.description).toEqual('Partially updated server description');
    
    // These should remain unchanged
    expect(result.type).toEqual('Server');
    expect(result.make).toEqual('Dell');
    expect(result.model).toEqual('PowerEdge R740');
    expect(result.serial_number).toEqual('SN123456789');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated hardware asset to database', async () => {
    // Perform the update
    const result = await updateHardwareAsset(updateTestInput);

    // Query using proper drizzle syntax
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    const updatedAsset = hardwareAssets[0];
    
    expect(updatedAsset.name).toEqual('Updated Server');
    expect(updatedAsset.type).toEqual('Storage');
    expect(updatedAsset.make).toEqual('HP');
    expect(updatedAsset.model).toEqual('StorageServer 2000');
    expect(updatedAsset.serial_number).toEqual('SN987654321');
    expect(updatedAsset.description).toEqual('Updated test server');
    expect(updatedAsset.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when trying to update non-existent hardware asset', async () => {
    const nonExistentUpdate: UpdateHardwareAssetInput = {
      id: 99999,
      name: 'Non-existent Asset'
    };

    await expect(updateHardwareAsset(nonExistentUpdate))
      .rejects
      .toThrow(/Hardware asset with id 99999 not found/);
  });
});
