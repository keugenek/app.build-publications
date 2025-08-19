import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

// Test data for hardware assets
const testHardwareAsset1: CreateHardwareAssetInput = {
  name: 'Web Server 01',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Rack A1'
};

const testHardwareAsset2: CreateHardwareAssetInput = {
  name: 'Network Switch',
  type: 'switch',
  make: 'Cisco',
  model: 'Catalyst 2960',
  location: 'Rack B2'
};

const testHardwareAsset3: CreateHardwareAssetInput = {
  name: 'Firewall Device',
  type: 'firewall',
  make: null,
  model: null,
  location: null
};

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all hardware assets', async () => {
    // Create test hardware assets
    await db.insert(hardwareAssetsTable)
      .values([testHardwareAsset1, testHardwareAsset2, testHardwareAsset3])
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);

    // Check first asset
    const webServer = result.find(asset => asset.name === 'Web Server 01');
    expect(webServer).toBeDefined();
    expect(webServer!.type).toEqual('server');
    expect(webServer!.make).toEqual('Dell');
    expect(webServer!.model).toEqual('PowerEdge R740');
    expect(webServer!.location).toEqual('Rack A1');
    expect(webServer!.id).toBeDefined();
    expect(webServer!.created_at).toBeInstanceOf(Date);
    expect(webServer!.updated_at).toBeInstanceOf(Date);

    // Check second asset
    const networkSwitch = result.find(asset => asset.name === 'Network Switch');
    expect(networkSwitch).toBeDefined();
    expect(networkSwitch!.type).toEqual('switch');
    expect(networkSwitch!.make).toEqual('Cisco');
    expect(networkSwitch!.model).toEqual('Catalyst 2960');
    expect(networkSwitch!.location).toEqual('Rack B2');

    // Check third asset with nullable fields
    const firewall = result.find(asset => asset.name === 'Firewall Device');
    expect(firewall).toBeDefined();
    expect(firewall!.type).toEqual('firewall');
    expect(firewall!.make).toBeNull();
    expect(firewall!.model).toBeNull();
    expect(firewall!.location).toBeNull();
  });

  it('should return hardware assets with proper field types', async () => {
    // Create single test asset
    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset1)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    const asset = result[0];

    // Verify types
    expect(typeof asset.id).toBe('number');
    expect(typeof asset.name).toBe('string');
    expect(typeof asset.type).toBe('string');
    expect(typeof asset.make).toBe('string');
    expect(typeof asset.model).toBe('string');
    expect(typeof asset.location).toBe('string');
    expect(asset.created_at).toBeInstanceOf(Date);
    expect(asset.updated_at).toBeInstanceOf(Date);
  });

  it('should handle mixed hardware types correctly', async () => {
    // Create assets of different types
    const mixedAssets: CreateHardwareAssetInput[] = [
      { name: 'Server', type: 'server', make: 'HP', model: 'ProLiant', location: 'DC1' },
      { name: 'Router', type: 'router', make: 'Juniper', model: 'MX240', location: 'DC2' },
      { name: 'Storage', type: 'storage', make: 'NetApp', model: 'FAS2720', location: 'DC1' },
      { name: 'Other Device', type: 'other', make: null, model: null, location: null }
    ];

    await db.insert(hardwareAssetsTable)
      .values(mixedAssets)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(4);

    // Check all types are present
    const types = result.map(asset => asset.type);
    expect(types).toContain('server');
    expect(types).toContain('router');
    expect(types).toContain('storage');
    expect(types).toContain('other');

    // Verify each asset has correct structure
    result.forEach(asset => {
      expect(asset.id).toBeDefined();
      expect(asset.name).toBeDefined();
      expect(asset.type).toBeDefined();
      expect(asset.created_at).toBeInstanceOf(Date);
      expect(asset.updated_at).toBeInstanceOf(Date);
      // make, model, location can be null
    });
  });

  it('should return assets in database insertion order', async () => {
    const orderedAssets: CreateHardwareAssetInput[] = [
      { name: 'Asset A', type: 'server', make: 'Make A', model: 'Model A', location: 'Loc A' },
      { name: 'Asset B', type: 'switch', make: 'Make B', model: 'Model B', location: 'Loc B' },
      { name: 'Asset C', type: 'router', make: 'Make C', model: 'Model C', location: 'Loc C' }
    ];

    // Insert assets one by one to ensure order
    for (const asset of orderedAssets) {
      await db.insert(hardwareAssetsTable)
        .values(asset)
        .execute();
    }

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Asset A');
    expect(result[1].name).toEqual('Asset B');
    expect(result[2].name).toEqual('Asset C');

    // Verify IDs are in ascending order (auto-increment)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
