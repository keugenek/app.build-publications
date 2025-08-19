import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type IdParam } from '../schema';
import { getHardwareAsset } from '../handlers/get_hardware_asset';

// Test input for creating hardware assets
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Datacenter A'
};

describe('getHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a hardware asset when found', async () => {
    // Create a test hardware asset
    const insertResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const params: IdParam = { id: createdAsset.id };

    // Get the hardware asset
    const result = await getHardwareAsset(params);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('server');
    expect(result!.make).toEqual('Dell');
    expect(result!.model).toEqual('PowerEdge R740');
    expect(result!.location).toEqual('Datacenter A');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when hardware asset is not found', async () => {
    const params: IdParam = { id: 999 }; // Non-existent ID

    const result = await getHardwareAsset(params);

    expect(result).toBeNull();
  });

  it('should handle hardware asset with nullable fields', async () => {
    // Create hardware asset with minimal required fields
    const minimalAsset = {
      name: 'Minimal Server',
      type: 'server' as const,
      make: null,
      model: null,
      location: null
    };

    const insertResult = await db.insert(hardwareAssetsTable)
      .values(minimalAsset)
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const params: IdParam = { id: createdAsset.id };

    // Get the hardware asset
    const result = await getHardwareAsset(params);

    // Verify the result with null values
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Minimal Server');
    expect(result!.type).toEqual('server');
    expect(result!.make).toBeNull();
    expect(result!.model).toBeNull();
    expect(result!.location).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should work with different hardware types', async () => {
    // Test with different hardware types
    const switchAsset = {
      name: 'Core Switch',
      type: 'switch' as const,
      make: 'Cisco',
      model: 'Catalyst 9300',
      location: 'Network Room'
    };

    const insertResult = await db.insert(hardwareAssetsTable)
      .values(switchAsset)
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const params: IdParam = { id: createdAsset.id };

    // Get the hardware asset
    const result = await getHardwareAsset(params);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.type).toEqual('switch');
    expect(result!.name).toEqual('Core Switch');
    expect(result!.make).toEqual('Cisco');
    expect(result!.model).toEqual('Catalyst 9300');
  });

  it('should return correct asset when multiple assets exist', async () => {
    // Create multiple hardware assets
    const asset1 = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Server 1',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge',
        location: 'Rack 1'
      })
      .returning()
      .execute();

    const asset2 = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Server 2',
        type: 'server',
        make: 'HP',
        model: 'ProLiant',
        location: 'Rack 2'
      })
      .returning()
      .execute();

    // Get the second asset specifically
    const params: IdParam = { id: asset2[0].id };
    const result = await getHardwareAsset(params);

    // Verify we get the correct asset
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(asset2[0].id);
    expect(result!.name).toEqual('Server 2');
    expect(result!.make).toEqual('HP');
    expect(result!.model).toEqual('ProLiant');
    expect(result!.location).toEqual('Rack 2');
  });
});
