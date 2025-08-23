import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type UpdateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

// Helper function to create a hardware asset for testing
const createHardwareAsset = async (input: CreateHardwareAssetInput) => {
  const result = await db.insert(hardwareAssetsTable)
    .values({
      name: input.name,
      type: input.type,
      description: input.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a hardware asset name', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Update the hardware asset
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id,
      name: 'Updated Server Name'
    };

    const result = await updateHardwareAsset(updateInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Updated Server Name');
    expect(result!.type).toEqual('server');
    expect(result!.description).toEqual('A test server');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update a hardware asset type', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Update the hardware asset type
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id,
      type: 'switch'
    };

    const result = await updateHardwareAsset(updateInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('switch');
    expect(result!.description).toEqual('A test server');
  });

  it('should update a hardware asset description', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Update the hardware asset description
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id,
      description: 'An updated test server description'
    };

    const result = await updateHardwareAsset(updateInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('server');
    expect(result!.description).toEqual('An updated test server description');
  });

  it('should update multiple fields at once', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Update multiple fields
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id,
      name: 'Updated Server',
      type: 'switch',
      description: 'An updated switch'
    };

    const result = await updateHardwareAsset(updateInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Updated Server');
    expect(result!.type).toEqual('switch');
    expect(result!.description).toEqual('An updated switch');
  });

  it('should return null when trying to update a non-existent hardware asset', async () => {
    const updateInput: UpdateHardwareAssetInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Server'
    };

    const result = await updateHardwareAsset(updateInput);
    
    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Try to update with no fields
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id
    };

    const result = await updateHardwareAsset(updateInput);
    
    expect(result).toBeNull();
  });

  it('should save updated hardware asset to database', async () => {
    // Create a test hardware asset
    const createdAsset = await createHardwareAsset({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    });

    // Update the hardware asset
    const updateInput: UpdateHardwareAssetInput = {
      id: createdAsset.id,
      name: 'Database Updated Server'
    };

    await updateHardwareAsset(updateInput);

    // Query the database to verify the update was saved
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdAsset.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Updated Server');
    expect(assets[0].type).toEqual('server');
    expect(assets[0].description).toEqual('A test server');
    expect(assets[0].created_at).toBeInstanceOf(Date);
  });
});
