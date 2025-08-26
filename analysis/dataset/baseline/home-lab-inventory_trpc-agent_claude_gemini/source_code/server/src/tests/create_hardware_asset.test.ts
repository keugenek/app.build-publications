import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Rack A1'
};

// Test input with minimal required fields (nullable fields as null)
const minimalTestInput: CreateHardwareAssetInput = {
  name: 'Minimal Server',
  type: 'switch',
  make: null,
  model: null,
  location: null
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset with all fields', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Server');
    expect(result.type).toEqual('server');
    expect(result.make).toEqual('Dell');
    expect(result.model).toEqual('PowerEdge R740');
    expect(result.location).toEqual('Rack A1');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a hardware asset with minimal fields', async () => {
    const result = await createHardwareAsset(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Server');
    expect(result.type).toEqual('switch');
    expect(result.make).toBeNull();
    expect(result.model).toBeNull();
    expect(result.location).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save hardware asset to database', async () => {
    const result = await createHardwareAsset(testInput);

    // Query using proper drizzle syntax
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    expect(hardwareAssets[0].name).toEqual('Test Server');
    expect(hardwareAssets[0].type).toEqual('server');
    expect(hardwareAssets[0].make).toEqual('Dell');
    expect(hardwareAssets[0].model).toEqual('PowerEdge R740');
    expect(hardwareAssets[0].location).toEqual('Rack A1');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(hardwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple hardware assets with different types', async () => {
    const routerInput: CreateHardwareAssetInput = {
      name: 'Core Router',
      type: 'router',
      make: 'Cisco',
      model: 'ASR 9000',
      location: 'Network Closet'
    };

    const firewallInput: CreateHardwareAssetInput = {
      name: 'Main Firewall',
      type: 'firewall',
      make: 'Fortinet',
      model: 'FortiGate 100F',
      location: 'DMZ Rack'
    };

    const server = await createHardwareAsset(testInput);
    const router = await createHardwareAsset(routerInput);
    const firewall = await createHardwareAsset(firewallInput);

    // Verify each asset was created with correct type
    expect(server.type).toEqual('server');
    expect(router.type).toEqual('router');
    expect(firewall.type).toEqual('firewall');

    // Verify all assets have unique IDs
    expect(server.id).not.toEqual(router.id);
    expect(server.id).not.toEqual(firewall.id);
    expect(router.id).not.toEqual(firewall.id);
  });

  it('should handle storage and other hardware types', async () => {
    const storageInput: CreateHardwareAssetInput = {
      name: 'NAS Storage',
      type: 'storage',
      make: 'Synology',
      model: 'DS920+',
      location: 'Storage Room'
    };

    const otherInput: CreateHardwareAssetInput = {
      name: 'KVM Switch',
      type: 'other',
      make: 'Raritan',
      model: 'DKX3-864',
      location: 'Control Console'
    };

    const storage = await createHardwareAsset(storageInput);
    const other = await createHardwareAsset(otherInput);

    expect(storage.type).toEqual('storage');
    expect(storage.name).toEqual('NAS Storage');
    expect(other.type).toEqual('other');
    expect(other.name).toEqual('KVM Switch');
  });
});
