import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

// Test data
const testAsset1: CreateHardwareAssetInput = {
  name: 'Dell OptiPlex 7090',
  type: 'Desktop Computer',
  make: 'Dell',
  model: 'OptiPlex 7090',
  serial_number: 'DL001234',
  description: 'Main workstation for development team'
};

const testAsset2: CreateHardwareAssetInput = {
  name: 'HP ProBook 450',
  type: 'Laptop',
  make: 'HP',
  model: 'ProBook 450 G8',
  serial_number: null,
  description: null
};

const testAsset3: CreateHardwareAssetInput = {
  name: 'Cisco Switch 2960',
  type: 'Network Equipment',
  make: 'Cisco',
  model: '2960-24TC-L',
  serial_number: 'CS987654',
  description: 'Main network switch for office'
};

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();

    expect(result).toEqual([]);
  });

  it('should return single hardware asset', async () => {
    // Insert test asset
    await db.insert(hardwareAssetsTable)
      .values(testAsset1)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Dell OptiPlex 7090');
    expect(result[0].type).toEqual('Desktop Computer');
    expect(result[0].make).toEqual('Dell');
    expect(result[0].model).toEqual('OptiPlex 7090');
    expect(result[0].serial_number).toEqual('DL001234');
    expect(result[0].description).toEqual('Main workstation for development team');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple hardware assets', async () => {
    // Insert multiple test assets
    await db.insert(hardwareAssetsTable)
      .values([testAsset1, testAsset2, testAsset3])
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);
    
    // Check that all assets are returned
    const names = result.map(asset => asset.name);
    expect(names).toContain('Dell OptiPlex 7090');
    expect(names).toContain('HP ProBook 450');
    expect(names).toContain('Cisco Switch 2960');
  });

  it('should handle hardware assets with nullable fields', async () => {
    // Insert asset with null serial_number and description
    await db.insert(hardwareAssetsTable)
      .values(testAsset2)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('HP ProBook 450');
    expect(result[0].serial_number).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].make).toEqual('HP');
    expect(result[0].model).toEqual('ProBook 450 G8');
  });

  it('should return assets with correct field types', async () => {
    // Insert test asset
    await db.insert(hardwareAssetsTable)
      .values(testAsset1)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    const asset = result[0];
    
    // Verify field types
    expect(typeof asset.id).toBe('number');
    expect(typeof asset.name).toBe('string');
    expect(typeof asset.type).toBe('string');
    expect(typeof asset.make).toBe('string');
    expect(typeof asset.model).toBe('string');
    expect(asset.serial_number === null || typeof asset.serial_number === 'string').toBe(true);
    expect(asset.description === null || typeof asset.description === 'string').toBe(true);
    expect(asset.created_at).toBeInstanceOf(Date);
    expect(asset.updated_at).toBeInstanceOf(Date);
  });

  it('should maintain correct ordering of assets', async () => {
    // Insert assets in specific order
    const asset1 = await db.insert(hardwareAssetsTable)
      .values(testAsset1)
      .returning()
      .execute();

    const asset2 = await db.insert(hardwareAssetsTable)
      .values(testAsset2)
      .returning()
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(2);
    // Assets should be returned in insertion order (by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('Dell OptiPlex 7090');
    expect(result[1].name).toEqual('HP ProBook 450');
  });
});
