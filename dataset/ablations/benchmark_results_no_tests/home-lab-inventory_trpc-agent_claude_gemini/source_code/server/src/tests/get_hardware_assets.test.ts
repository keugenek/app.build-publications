import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

// Test input data
const testHardwareAsset1: CreateHardwareAssetInput = {
  name: 'Web Server 01',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge R740',
  manufacturer: 'Dell',
  serial_number: 'ABC123456',
  location: 'Data Center Rack A1',
  notes: 'Primary web server'
};

const testHardwareAsset2: CreateHardwareAssetInput = {
  name: 'Core Switch',
  type: 'network_switch',
  status: 'maintenance',
  model: 'Cisco Catalyst 9300',
  manufacturer: 'Cisco',
  serial_number: 'XYZ789012',
  location: 'Network Closet B',
  notes: 'Core network switch - scheduled maintenance'
};

const testHardwareAsset3: CreateHardwareAssetInput = {
  name: 'Backup Firewall',
  type: 'firewall',
  status: 'inactive',
  model: null,
  manufacturer: null,
  serial_number: null,
  location: null,
  notes: null
};

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all hardware assets', async () => {
    // Create test hardware assets
    await db.insert(hardwareAssetsTable)
      .values([testHardwareAsset1, testHardwareAsset2, testHardwareAsset3])
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Verify all assets are returned
    const names = result.map(asset => asset.name).sort();
    expect(names).toEqual(['Backup Firewall', 'Core Switch', 'Web Server 01']);
  });

  it('should return hardware assets with correct structure and data types', async () => {
    // Create a test hardware asset
    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset1)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    const asset = result[0];

    // Verify required fields
    expect(asset.id).toBeDefined();
    expect(typeof asset.id).toBe('number');
    expect(asset.name).toEqual('Web Server 01');
    expect(asset.type).toEqual('server');
    expect(asset.status).toEqual('active');

    // Verify optional fields
    expect(asset.model).toEqual('Dell PowerEdge R740');
    expect(asset.manufacturer).toEqual('Dell');
    expect(asset.serial_number).toEqual('ABC123456');
    expect(asset.location).toEqual('Data Center Rack A1');
    expect(asset.notes).toEqual('Primary web server');

    // Verify timestamps
    expect(asset.created_at).toBeInstanceOf(Date);
    expect(asset.updated_at).toBeInstanceOf(Date);
  });

  it('should handle hardware assets with null optional fields', async () => {
    // Create a hardware asset with null optional fields
    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset3)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    const asset = result[0];

    expect(asset.name).toEqual('Backup Firewall');
    expect(asset.type).toEqual('firewall');
    expect(asset.status).toEqual('inactive');
    expect(asset.model).toBeNull();
    expect(asset.manufacturer).toBeNull();
    expect(asset.serial_number).toBeNull();
    expect(asset.location).toBeNull();
    expect(asset.notes).toBeNull();
  });

  it('should return hardware assets with different types and statuses', async () => {
    // Create hardware assets with various types and statuses
    await db.insert(hardwareAssetsTable)
      .values([testHardwareAsset1, testHardwareAsset2, testHardwareAsset3])
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);

    // Verify different types are present
    const types = result.map(asset => asset.type).sort();
    expect(types).toEqual(['firewall', 'network_switch', 'server']);

    // Verify different statuses are present
    const statuses = result.map(asset => asset.status).sort();
    expect(statuses).toEqual(['active', 'inactive', 'maintenance']);
  });

  it('should return assets ordered by database insertion order', async () => {
    // Insert assets in specific order
    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset1)
      .execute();

    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset2)
      .execute();

    await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset3)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);
    // Should maintain insertion order (by id)
    expect(result[0].name).toEqual('Web Server 01');
    expect(result[1].name).toEqual('Core Switch');
    expect(result[2].name).toEqual('Backup Firewall');

    // Verify ids are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
