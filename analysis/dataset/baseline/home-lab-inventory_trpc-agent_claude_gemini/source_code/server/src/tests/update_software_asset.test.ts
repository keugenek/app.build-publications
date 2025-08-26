import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type UpdateSoftwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

// Test inputs
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge',
  location: 'Data Center A'
};

const testSoftwareInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'vm',
  host_id: null,
  description: 'Original description'
};

const fullUpdateInput: UpdateSoftwareAssetInput = {
  id: 0, // Will be set in tests
  name: 'Updated VM',
  type: 'container',
  host_id: null, // Will be set in tests
  description: 'Updated description'
};

describe('updateSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a software asset', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        make: testHardwareInput.make,
        model: testHardwareInput.model,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];
    const createdHardware = hardwareResult[0];

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      name: 'Updated VM',
      type: 'container',
      host_id: createdHardware.id,
      description: 'Updated description'
    };

    const result = await updateSoftwareAsset(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdSoftware.id);
    expect(result.name).toEqual('Updated VM');
    expect(result.type).toEqual('container');
    expect(result.host_id).toEqual(createdHardware.id);
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(createdSoftware.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdSoftware.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];

    // Update only name and description
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      name: 'Partially Updated VM',
      description: 'New description only'
    };

    const result = await updateSoftwareAsset(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated VM');
    expect(result.description).toEqual('New description only');
    // Verify unchanged fields
    expect(result.type).toEqual(createdSoftware.type);
    expect(result.host_id).toEqual(createdSoftware.host_id);
    expect(result.created_at).toEqual(createdSoftware.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdSoftware.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      name: 'Database Updated VM',
      type: 'application'
    };

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    await updateSoftwareAsset(updateInput);

    // Query database directly to verify changes
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, createdSoftware.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Database Updated VM');
    expect(softwareAssets[0].type).toEqual('application');
    expect(softwareAssets[0].description).toEqual(createdSoftware.description);
    expect(softwareAssets[0].updated_at).toBeInstanceOf(Date);
    expect(softwareAssets[0].updated_at.getTime()).toBeGreaterThanOrEqual(createdSoftware.updated_at.getTime());
  });

  it('should set host_id to null when explicitly provided', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        make: testHardwareInput.make,
        model: testHardwareInput.model,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    // Create software asset with host_id set
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: hardwareResult[0].id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];

    // Update to remove host_id
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      host_id: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.host_id).toBeNull();
  });

  it('should throw error when software asset not found', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 99999,
      name: 'Non-existent VM'
    };

    expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/software asset with id 99999 not found/i);
  });

  it('should throw error when host_id references non-existent hardware asset', async () => {
    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];

    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      host_id: 99999
    };

    expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should validate existing host_id when provided', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        make: testHardwareInput.make,
        model: testHardwareInput.model,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];
    const createdHardware = hardwareResult[0];

    // Update with valid host_id
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      host_id: createdHardware.id,
      description: 'Now has a valid host'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.host_id).toEqual(createdHardware.id);
    expect(result.description).toEqual('Now has a valid host');
  });

  it('should update timestamp correctly', async () => {
    // Create software asset to update
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: testSoftwareInput.host_id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const createdSoftware = softwareResult[0];
    const originalUpdatedAt = createdSoftware.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: createdSoftware.id,
      name: 'Timestamp Test VM'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.created_at).toEqual(createdSoftware.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
