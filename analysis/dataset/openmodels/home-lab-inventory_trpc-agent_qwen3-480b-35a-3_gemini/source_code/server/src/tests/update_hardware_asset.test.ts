import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type UpdateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a hardware asset
const createTestInput: CreateHardwareAssetInput = {
  name: 'Test Laptop',
  type: 'Laptop',
  model: 'ThinkPad X1',
  serialNumber: 'ABC123',
  location: 'Office 1'
};

// Test input for updating
const updateTestInput: UpdateHardwareAssetInput = {
  id: 1,
  name: 'Updated Laptop',
  location: 'Office 2'
};

describe('updateHardwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test hardware asset first
    await db.insert(hardwareAssetsTable).values(createTestInput).execute();
  });
  
  afterEach(resetDB);

  it('should update a hardware asset', async () => {
    const result = await updateHardwareAsset(updateTestInput);

    // Basic field validation
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Laptop');
    expect(result!.type).toEqual('Laptop');
    expect(result!.model).toEqual('ThinkPad X1');
    expect(result!.serialNumber).toEqual('ABC123');
    expect(result!.location).toEqual('Office 2');
    expect(result!.id).toEqual(1);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should save updated hardware asset to database', async () => {
    await updateHardwareAsset(updateTestInput);

    // Query using proper drizzle syntax
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, 1))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    expect(hardwareAssets[0].name).toEqual('Updated Laptop');
    expect(hardwareAssets[0].location).toEqual('Office 2');
    expect(hardwareAssets[0].type).toEqual('Laptop');
    expect(hardwareAssets[0].model).toEqual('ThinkPad X1');
    expect(hardwareAssets[0].serialNumber).toEqual('ABC123');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null when updating non-existent hardware asset', async () => {
    const invalidUpdate: UpdateHardwareAssetInput = {
      id: 99999,
      name: 'Non-existent'
    };
    
    const result = await updateHardwareAsset(invalidUpdate);
    expect(result).toBeNull();
  });

  it('should return null when no fields are provided for update', async () => {
    const emptyUpdate: UpdateHardwareAssetInput = {
      id: 1
      // No other fields provided
    };
    
    const result = await updateHardwareAsset(emptyUpdate);
    expect(result).toBeNull();
  });

  it('should update only specified fields', async () => {
    const partialUpdate: UpdateHardwareAssetInput = {
      id: 1,
      location: 'Conference Room 3'
      // Only updating location, other fields should remain unchanged
    };
    
    const result = await updateHardwareAsset(partialUpdate);
    
    expect(result).not.toBeNull();
    expect(result!.location).toEqual('Conference Room 3');
    expect(result!.name).toEqual('Test Laptop'); // Should remain unchanged
    expect(result!.type).toEqual('Laptop'); // Should remain unchanged
  });
});
