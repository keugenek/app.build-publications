import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a hardware asset
const createTestInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge',
  manufacturer: 'Dell',
  serial_number: 'SN12345',
  location: 'Data Center A',
  notes: 'Test hardware asset'
};

describe('updateHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a hardware asset successfully', async () => {
    // Create a hardware asset first
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Update the asset
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Updated Server Name',
      type: 'firewall',
      status: 'maintenance',
      model: 'Updated Model',
      manufacturer: 'Updated Manufacturer',
      serial_number: 'UPDATED_SN123',
      location: 'Data Center B',
      notes: 'Updated notes'
    };

    const result = await updateHardwareAsset(updateInput);

    // Verify the result
    expect(result).toBeTruthy();
    expect(result!.id).toEqual(assetId);
    expect(result!.name).toEqual('Updated Server Name');
    expect(result!.type).toEqual('firewall');
    expect(result!.status).toEqual('maintenance');
    expect(result!.model).toEqual('Updated Model');
    expect(result!.manufacturer).toEqual('Updated Manufacturer');
    expect(result!.serial_number).toEqual('UPDATED_SN123');
    expect(result!.location).toEqual('Data Center B');
    expect(result!.notes).toEqual('Updated notes');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdAsset[0].updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create a hardware asset first
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Update only name and status
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Partially Updated Name',
      status: 'inactive'
    };

    const result = await updateHardwareAsset(updateInput);

    // Verify the result
    expect(result).toBeTruthy();
    expect(result!.id).toEqual(assetId);
    expect(result!.name).toEqual('Partially Updated Name');
    expect(result!.status).toEqual('inactive');
    // Other fields should remain unchanged
    expect(result!.type).toEqual('server');
    expect(result!.model).toEqual('Dell PowerEdge');
    expect(result!.manufacturer).toEqual('Dell');
    expect(result!.serial_number).toEqual('SN12345');
    expect(result!.location).toEqual('Data Center A');
    expect(result!.notes).toEqual('Test hardware asset');
  });

  it('should handle null values correctly', async () => {
    // Create a hardware asset first
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Update with null values
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      model: null,
      manufacturer: null,
      serial_number: null,
      location: null,
      notes: null
    };

    const result = await updateHardwareAsset(updateInput);

    // Verify the result
    expect(result).toBeTruthy();
    expect(result!.id).toEqual(assetId);
    expect(result!.model).toBeNull();
    expect(result!.manufacturer).toBeNull();
    expect(result!.serial_number).toBeNull();
    expect(result!.location).toBeNull();
    expect(result!.notes).toBeNull();
    // Non-updated fields should remain
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('server');
    expect(result!.status).toEqual('active');
  });

  it('should save updated asset to database', async () => {
    // Create a hardware asset first
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Update the asset
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Database Updated Name',
      type: 'router'
    };

    await updateHardwareAsset(updateInput);

    // Query the database to verify the update was persisted
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Updated Name');
    expect(assets[0].type).toEqual('router');
    expect(assets[0].updated_at).toBeInstanceOf(Date);
    expect(assets[0].updated_at > createdAsset[0].updated_at).toBe(true);
  });

  it('should return null for non-existent hardware asset', async () => {
    const updateInput: UpdateHardwareAssetInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Asset'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided for update', async () => {
    // Create a hardware asset first
    const createdAsset = await db.insert(hardwareAssetsTable)
      .values(createTestInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Update with only ID (no fields to update)
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result).toBeNull();
  });

  it('should handle all hardware types correctly', async () => {
    const hardwareTypes = ['server', 'network_switch', 'router', 'firewall', 'storage', 'other'] as const;
    
    for (const type of hardwareTypes) {
      // Create a hardware asset
      const createdAsset = await db.insert(hardwareAssetsTable)
        .values({
          ...createTestInput,
          name: `Test ${type}`,
          type: 'server' // Start with server type
        })
        .returning()
        .execute();

      const assetId = createdAsset[0].id;

      // Update to the specific type
      const updateInput: UpdateHardwareAssetInput = {
        id: assetId,
        type: type
      };

      const result = await updateHardwareAsset(updateInput);

      expect(result).toBeTruthy();
      expect(result!.type).toEqual(type);
    }
  });

  it('should handle all hardware statuses correctly', async () => {
    const statuses = ['active', 'inactive', 'maintenance', 'decommissioned'] as const;
    
    for (const status of statuses) {
      // Create a hardware asset
      const createdAsset = await db.insert(hardwareAssetsTable)
        .values({
          ...createTestInput,
          name: `Test ${status} Asset`
        })
        .returning()
        .execute();

      const assetId = createdAsset[0].id;

      // Update to the specific status
      const updateInput: UpdateHardwareAssetInput = {
        id: assetId,
        status: status
      };

      const result = await updateHardwareAsset(updateInput);

      expect(result).toBeTruthy();
      expect(result!.status).toEqual(status);
    }
  });
});
