import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

// Test data
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge',
  manufacturer: 'Dell',
  location: 'Data Center A'
};

const testSoftwareData = {
  name: 'Test VM',
  type: 'virtual_machine' as const,
  status: 'stopped' as const,
  operating_system: 'Ubuntu 20.04',
  version: '1.0',
  notes: 'Test virtual machine'
};

const testUpdateInput: UpdateSoftwareAssetInput = {
  id: 1, // Will be set dynamically in tests
  name: 'Updated VM',
  status: 'running',
  operating_system: 'Ubuntu 22.04',
  version: '2.0',
  notes: 'Updated test virtual machine'
};

describe('updateSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a software asset with all fields', async () => {
    // Create hardware asset first for foreign key reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareInput)
      .returning()
      .execute();
    const hardwareId = hardwareResult[0].id;

    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        ...testSoftwareData,
        host_hardware_id: hardwareId
      })
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update the software asset
    const updateInput = { ...testUpdateInput, id: softwareId, host_hardware_id: hardwareId };
    const result = await updateSoftwareAsset(updateInput);

    // Verify the update
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(softwareId);
    expect(result!.name).toEqual('Updated VM');
    expect(result!.status).toEqual('running');
    expect(result!.operating_system).toEqual('Ubuntu 22.04');
    expect(result!.version).toEqual('2.0');
    expect(result!.notes).toEqual('Updated test virtual machine');
    expect(result!.host_hardware_id).toEqual(hardwareId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specific fields', async () => {
    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values(testSoftwareData)
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update only name and status
    const partialUpdateInput: UpdateSoftwareAssetInput = {
      id: softwareId,
      name: 'Partially Updated VM',
      status: 'running'
    };

    const result = await updateSoftwareAsset(partialUpdateInput);

    // Verify only specified fields were updated
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partially Updated VM');
    expect(result!.status).toEqual('running');
    expect(result!.operating_system).toEqual('Ubuntu 20.04'); // Should remain unchanged
    expect(result!.version).toEqual('1.0'); // Should remain unchanged
    expect(result!.notes).toEqual('Test virtual machine'); // Should remain unchanged
  });

  it('should update host hardware reference', async () => {
    // Create two hardware assets
    const hardware1Result = await db.insert(hardwareAssetsTable)
      .values(testHardwareInput)
      .returning()
      .execute();
    const hardware1Id = hardware1Result[0].id;

    const hardware2Result = await db.insert(hardwareAssetsTable)
      .values({
        ...testHardwareInput,
        name: 'Second Test Server'
      })
      .returning()
      .execute();
    const hardware2Id = hardware2Result[0].id;

    // Create software asset assigned to first hardware
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        ...testSoftwareData,
        host_hardware_id: hardware1Id
      })
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update to second hardware
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareId,
      host_hardware_id: hardware2Id
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).not.toBeNull();
    expect(result!.host_hardware_id).toEqual(hardware2Id);
  });

  it('should set host hardware to null', async () => {
    // Create hardware asset and software asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareInput)
      .returning()
      .execute();
    const hardwareId = hardwareResult[0].id;

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        ...testSoftwareData,
        host_hardware_id: hardwareId
      })
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update to remove hardware assignment
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareId,
      host_hardware_id: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).not.toBeNull();
    expect(result!.host_hardware_id).toBeNull();
  });

  it('should save updated software asset to database', async () => {
    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values(testSoftwareData)
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update the software asset
    const updateInput = { ...testUpdateInput, id: softwareId };
    await updateSoftwareAsset(updateInput);

    // Verify in database
    const savedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareId))
      .execute();

    expect(savedAssets).toHaveLength(1);
    const savedAsset = savedAssets[0];
    expect(savedAsset.name).toEqual('Updated VM');
    expect(savedAsset.status).toEqual('running');
    expect(savedAsset.operating_system).toEqual('Ubuntu 22.04');
    expect(savedAsset.version).toEqual('2.0');
    expect(savedAsset.notes).toEqual('Updated test virtual machine');
    expect(savedAsset.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 9999, // Non-existent ID
      name: 'This should not work'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values(testSoftwareData)
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update with only ID (no actual fields to update)
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareId
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).toBeNull();
  });

  it('should handle nullable fields properly', async () => {
    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values(testSoftwareData)
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;

    // Update with null values
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareId,
      operating_system: null,
      version: null,
      notes: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).not.toBeNull();
    expect(result!.operating_system).toBeNull();
    expect(result!.version).toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('should update timestamp correctly', async () => {
    // Create initial software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values(testSoftwareData)
      .returning()
      .execute();
    const softwareId = softwareResult[0].id;
    const originalTimestamp = softwareResult[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareId,
      name: 'Updated Name'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});
