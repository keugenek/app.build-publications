import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type GetByIdInput, type CreateHardwareAssetInput } from '../schema';
import { getHardwareAssetById } from '../handlers/get_hardware_asset_by_id';

// Test hardware asset data
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Dell PowerEdge R740',
  type: 'Server',
  manufacturer: 'Dell',
  model: 'PowerEdge R740',
  description: 'Production database server'
};

const testHardwareAssetMinimal: CreateHardwareAssetInput = {
  name: 'Cisco Catalyst 2960',
  type: 'Switch',
  manufacturer: 'Cisco',
  model: 'Catalyst 2960',
  description: null
};

describe('getHardwareAssetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return hardware asset when found', async () => {
    // Create a test hardware asset
    const insertResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset)
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: GetByIdInput = { id: createdAsset.id };

    // Retrieve the hardware asset
    const result = await getHardwareAssetById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Dell PowerEdge R740');
    expect(result!.type).toEqual('Server');
    expect(result!.manufacturer).toEqual('Dell');
    expect(result!.model).toEqual('PowerEdge R740');
    expect(result!.description).toEqual('Production database server');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return hardware asset with null description', async () => {
    // Create a test hardware asset with null description
    const insertResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAssetMinimal)
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: GetByIdInput = { id: createdAsset.id };

    // Retrieve the hardware asset
    const result = await getHardwareAssetById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Cisco Catalyst 2960');
    expect(result!.type).toEqual('Switch');
    expect(result!.manufacturer).toEqual('Cisco');
    expect(result!.model).toEqual('Catalyst 2960');
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when hardware asset not found', async () => {
    const input: GetByIdInput = { id: 999999 };

    const result = await getHardwareAssetById(input);

    expect(result).toBeNull();
  });

  it('should return correct hardware asset when multiple exist', async () => {
    // Create multiple test hardware assets
    const asset1Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Server 1',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'R730',
        description: 'First server'
      })
      .returning()
      .execute();

    const asset2Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Switch 1',
        type: 'Switch',
        manufacturer: 'Cisco',
        model: '2960',
        description: 'Network switch'
      })
      .returning()
      .execute();

    const asset1 = asset1Result[0];
    const asset2 = asset2Result[0];

    // Retrieve the second asset
    const input: GetByIdInput = { id: asset2.id };
    const result = await getHardwareAssetById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(asset2.id);
    expect(result!.name).toEqual('Switch 1');
    expect(result!.type).toEqual('Switch');
    expect(result!.manufacturer).toEqual('Cisco');
    expect(result!.model).toEqual('2960');
    expect(result!.description).toEqual('Network switch');

    // Verify we didn't get the first asset
    expect(result!.id).not.toEqual(asset1.id);
    expect(result!.name).not.toEqual('Server 1');
  });

  it('should handle edge case with ID 0', async () => {
    const input: GetByIdInput = { id: 0 };

    const result = await getHardwareAssetById(input);

    expect(result).toBeNull();
  });

  it('should handle negative ID values', async () => {
    const input: GetByIdInput = { id: -1 };

    const result = await getHardwareAssetById(input);

    expect(result).toBeNull();
  });
});
