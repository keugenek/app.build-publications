import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type IdInput, type CreateHardwareAssetInput } from '../schema';
import { getHardwareAsset } from '../handlers/get_hardware_asset';

// Test input for creating a hardware asset
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge R730',
  manufacturer: 'Dell',
  serial_number: 'SN123456789',
  location: 'Data Center A',
  notes: 'Test server for unit testing'
};

describe('getHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a hardware asset by ID', async () => {
    // First create a hardware asset to retrieve
    const createdAssets = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        status: testHardwareAsset.status,
        model: testHardwareAsset.model,
        manufacturer: testHardwareAsset.manufacturer,
        serial_number: testHardwareAsset.serial_number,
        location: testHardwareAsset.location,
        notes: testHardwareAsset.notes
      })
      .returning()
      .execute();

    const createdAsset = createdAssets[0];
    const input: IdInput = { id: createdAsset.id };

    // Get the hardware asset
    const result = await getHardwareAsset(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('server');
    expect(result!.status).toEqual('active');
    expect(result!.model).toEqual('Dell PowerEdge R730');
    expect(result!.manufacturer).toEqual('Dell');
    expect(result!.serial_number).toEqual('SN123456789');
    expect(result!.location).toEqual('Data Center A');
    expect(result!.notes).toEqual('Test server for unit testing');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent hardware asset', async () => {
    const input: IdInput = { id: 99999 };

    const result = await getHardwareAsset(input);

    expect(result).toBeNull();
  });

  it('should handle hardware asset with minimal data', async () => {
    // Create hardware asset with only required fields
    const minimalAsset: CreateHardwareAssetInput = {
      name: 'Minimal Asset',
      type: 'other',
      status: 'active'
    };

    const createdAssets = await db.insert(hardwareAssetsTable)
      .values({
        name: minimalAsset.name,
        type: minimalAsset.type,
        status: minimalAsset.status
      })
      .returning()
      .execute();

    const createdAsset = createdAssets[0];
    const input: IdInput = { id: createdAsset.id };

    const result = await getHardwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Minimal Asset');
    expect(result!.type).toEqual('other');
    expect(result!.status).toEqual('active');
    expect(result!.model).toBeNull();
    expect(result!.manufacturer).toBeNull();
    expect(result!.serial_number).toBeNull();
    expect(result!.location).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different hardware types and statuses', async () => {
    // Create multiple hardware assets with different types and statuses
    const networkSwitch: CreateHardwareAssetInput = {
      name: 'Network Switch 1',
      type: 'network_switch',
      status: 'maintenance',
      model: 'Cisco Catalyst 2960',
      manufacturer: 'Cisco',
      location: 'Network Closet B'
    };

    const createdAssets = await db.insert(hardwareAssetsTable)
      .values({
        name: networkSwitch.name,
        type: networkSwitch.type,
        status: networkSwitch.status,
        model: networkSwitch.model,
        manufacturer: networkSwitch.manufacturer,
        location: networkSwitch.location
      })
      .returning()
      .execute();

    const createdAsset = createdAssets[0];
    const input: IdInput = { id: createdAsset.id };

    const result = await getHardwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Network Switch 1');
    expect(result!.type).toEqual('network_switch');
    expect(result!.status).toEqual('maintenance');
    expect(result!.model).toEqual('Cisco Catalyst 2960');
    expect(result!.manufacturer).toEqual('Cisco');
    expect(result!.location).toEqual('Network Closet B');
  });

  it('should retrieve correct asset when multiple assets exist', async () => {
    // Create multiple hardware assets
    const assets = [
      {
        name: 'Server 1',
        type: 'server' as const,
        status: 'active' as const,
        model: 'HP ProLiant DL380'
      },
      {
        name: 'Router 1',
        type: 'router' as const,
        status: 'inactive' as const,
        manufacturer: 'Juniper'
      },
      {
        name: 'Firewall 1',
        type: 'firewall' as const,
        status: 'decommissioned' as const,
        serial_number: 'FW987654321'
      }
    ];

    const createdAssets = await db.insert(hardwareAssetsTable)
      .values(assets)
      .returning()
      .execute();

    // Get the second asset (Router 1)
    const targetAsset = createdAssets[1];
    const input: IdInput = { id: targetAsset.id };

    const result = await getHardwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetAsset.id);
    expect(result!.name).toEqual('Router 1');
    expect(result!.type).toEqual('router');
    expect(result!.status).toEqual('inactive');
    expect(result!.manufacturer).toEqual('Juniper');
    expect(result!.model).toBeNull();
    expect(result!.serial_number).toBeNull();
  });
});
