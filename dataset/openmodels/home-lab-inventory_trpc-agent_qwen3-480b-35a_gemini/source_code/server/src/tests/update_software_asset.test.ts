import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type UpdateSoftwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

// Test inputs
const testCreateInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM',
  host_id: 1,
  operating_system: 'Ubuntu 20.04',
  description: 'A test virtual machine'
};

const testUpdateInput: UpdateSoftwareAssetInput = {
  id: 1,
  name: 'Updated VM',
  type: 'Container',
  host_id: 2,
  operating_system: 'Alpine Linux',
  description: 'An updated container'
};

describe('updateSoftwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first as a host
    await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'R750',
        serial_number: 'ABC123',
        description: 'Test server'
      })
      .execute();
      
    // Create a software asset to update
    await db.insert(softwareAssetsTable)
      .values({
        name: testCreateInput.name,
        type: testCreateInput.type,
        host_id: testCreateInput.host_id,
        operating_system: testCreateInput.operating_system,
        description: testCreateInput.description
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a software asset with all fields', async () => {
    const result = await updateSoftwareAsset(testUpdateInput);

    // Validate the returned object
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated VM');
    expect(result.type).toEqual('Container');
    expect(result.host_id).toEqual(2);
    expect(result.operating_system).toEqual('Alpine Linux');
    expect(result.description).toEqual('An updated container');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields of a software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 1,
      name: 'Partially Updated VM',
      description: 'Partially updated description'
    };
    
    const result = await updateSoftwareAsset(updateInput);

    // Validate the updated fields
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Partially Updated VM');
    expect(result.description).toEqual('Partially updated description');
    
    // Validate that other fields remain unchanged
    expect(result.type).toEqual('VM');
    expect(result.host_id).toEqual(1);
    expect(result.operating_system).toEqual('Ubuntu 20.04');
  });

  it('should save updated software asset to database', async () => {
    await updateSoftwareAsset(testUpdateInput);

    // Query the database to verify the update was saved
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, 1))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Updated VM');
    expect(softwareAssets[0].type).toEqual('Container');
    expect(softwareAssets[0].host_id).toEqual(2);
    expect(softwareAssets[0].operating_system).toEqual('Alpine Linux');
    expect(softwareAssets[0].description).toEqual('An updated container');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 99999,
      name: 'Non-existent VM'
    };

    await expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/Software asset with id 99999 not found/);
  });
});
