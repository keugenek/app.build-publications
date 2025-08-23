import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateSoftwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';

// Helper function to create a hardware asset for testing
const createHardwareAsset = async (name: string, type: 'server' | 'switch', description: string | null = null) => {
  const result = await db.insert(hardwareAssetsTable)
    .values({
      name,
      type,
      description,
    })
    .returning()
    .execute();
  
  return result[0];
};

// Helper function to create a software asset for testing
const createSoftwareAsset = async (name: string, type: 'VM' | 'container', description: string | null, host_id: number) => {
  const result = await db.insert(softwareAssetsTable)
    .values({
      name,
      type,
      description,
      host_id,
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a software asset', async () => {
    // First create a hardware asset to serve as host
    const hardwareAsset = await createHardwareAsset('Test Server', 'server', 'A test server');

    // Create a software asset
    const softwareAsset = await createSoftwareAsset('Test VM', 'VM', 'A test VM', hardwareAsset.id);

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAsset.id,
      name: 'Updated VM',
      type: 'container',
      description: 'An updated container',
    };

    const result = await updateSoftwareAsset(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(softwareAsset.id);
    expect(result!.name).toEqual('Updated VM');
    expect(result!.type).toEqual('container');
    expect(result!.description).toEqual('An updated container');
    expect(result!.host_id).toEqual(hardwareAsset.id);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should partially update a software asset', async () => {
    // First create a hardware asset to serve as host
    const hardwareAsset = await createHardwareAsset('Test Server', 'server', 'A test server');

    // Create a software asset
    const softwareAsset = await createSoftwareAsset('Test VM', 'VM', 'A test VM', hardwareAsset.id);

    // Update only the name
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAsset.id,
      name: 'Partially Updated VM',
    };

    const result = await updateSoftwareAsset(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(softwareAsset.id);
    expect(result!.name).toEqual('Partially Updated VM');
    // Other fields should remain unchanged
    expect(result!.type).toEqual('VM');
    expect(result!.description).toEqual('A test VM');
    expect(result!.host_id).toEqual(hardwareAsset.id);
  });

  it('should update the host_id of a software asset', async () => {
    // Create two hardware assets
    const hardwareAsset1 = await createHardwareAsset('Test Server 1', 'server', 'First test server');
    const hardwareAsset2 = await createHardwareAsset('Test Server 2', 'server', 'Second test server');

    // Create a software asset with the first host
    const softwareAsset = await createSoftwareAsset('Test VM', 'VM', 'A test VM', hardwareAsset1.id);

    // Update the host_id
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAsset.id,
      host_id: hardwareAsset2.id,
    };

    const result = await updateSoftwareAsset(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.host_id).toEqual(hardwareAsset2.id);
  });

  it('should return null when trying to update a non-existent software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent VM',
    };

    const result = await updateSoftwareAsset(updateInput);
    
    expect(result).toBeNull();
  });

  it('should throw an error when trying to update with a non-existent host_id', async () => {
    // First create a hardware asset to serve as host
    const hardwareAsset = await createHardwareAsset('Test Server', 'server', 'A test server');

    // Create a software asset
    const softwareAsset = await createSoftwareAsset('Test VM', 'VM', 'A test VM', hardwareAsset.id);

    // Try to update with a non-existent host_id
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAsset.id,
      host_id: 99999, // Non-existent ID
    };

    await expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/not found/);
  });

  it('should save updated software asset to database', async () => {
    // First create a hardware asset to serve as host
    const hardwareAsset = await createHardwareAsset('Test Server', 'server', 'A test server');

    // Create a software asset
    const softwareAsset = await createSoftwareAsset('Test VM', 'VM', 'A test VM', hardwareAsset.id);

    // Update the software asset
    const updateInput: UpdateSoftwareAssetInput = {
      id: softwareAsset.id,
      name: 'Database Updated VM',
      description: 'Updated in database',
    };

    await updateSoftwareAsset(updateInput);

    // Query the database to verify the update was saved
    const updatedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(updatedAssets).toHaveLength(1);
    expect(updatedAssets[0].name).toEqual('Database Updated VM');
    expect(updatedAssets[0].description).toEqual('Updated in database');
    // Other fields should remain unchanged
    expect(updatedAssets[0].type).toEqual('VM');
    expect(updatedAssets[0].host_id).toEqual(hardwareAsset.id);
  });
});
