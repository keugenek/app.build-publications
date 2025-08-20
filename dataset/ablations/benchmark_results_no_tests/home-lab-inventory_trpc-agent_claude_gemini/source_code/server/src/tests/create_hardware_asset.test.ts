import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge R750',
  manufacturer: 'Dell',
  serial_number: 'SVR123456',
  location: 'Rack A1',
  notes: 'Primary web server'
};

// Minimal test input
const minimalInput: CreateHardwareAssetInput = {
  name: 'Minimal Server',
  type: 'router',
  status: 'active'
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset with all fields', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Server');
    expect(result.type).toEqual('server');
    expect(result.status).toEqual('active');
    expect(result.model).toEqual('Dell PowerEdge R750');
    expect(result.manufacturer).toEqual('Dell');
    expect(result.serial_number).toEqual('SVR123456');
    expect(result.location).toEqual('Rack A1');
    expect(result.notes).toEqual('Primary web server');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a hardware asset with minimal fields and apply defaults', async () => {
    const result = await createHardwareAsset(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Server');
    expect(result.type).toEqual('router');
    expect(result.status).toEqual('active'); // Default value from schema
    expect(result.model).toBeNull();
    expect(result.manufacturer).toBeNull();
    expect(result.serial_number).toBeNull();
    expect(result.location).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save hardware asset to database', async () => {
    const result = await createHardwareAsset(testInput);

    // Query using proper drizzle syntax
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Test Server');
    expect(assets[0].type).toEqual('server');
    expect(assets[0].status).toEqual('active');
    expect(assets[0].model).toEqual('Dell PowerEdge R750');
    expect(assets[0].manufacturer).toEqual('Dell');
    expect(assets[0].serial_number).toEqual('SVR123456');
    expect(assets[0].location).toEqual('Rack A1');
    expect(assets[0].notes).toEqual('Primary web server');
    expect(assets[0].created_at).toBeInstanceOf(Date);
    expect(assets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different hardware types', async () => {
    const inputs = [
      { ...testInput, type: 'network_switch' as const, name: 'Switch 1' },
      { ...testInput, type: 'firewall' as const, name: 'Firewall 1' },
      { ...testInput, type: 'storage' as const, name: 'Storage 1' },
      { ...testInput, type: 'other' as const, name: 'Other Device' }
    ];

    for (const input of inputs) {
      const result = await createHardwareAsset(input);
      expect(result.type).toEqual(input.type);
      expect(result.name).toEqual(input.name);
      expect(result.id).toBeDefined();
    }
  });

  it('should handle different status values', async () => {
    const statuses = ['inactive', 'maintenance', 'decommissioned'] as const;

    for (const status of statuses) {
      const input = { ...testInput, status, name: `Server ${status}` };
      const result = await createHardwareAsset(input);
      
      expect(result.status).toEqual(status);
      expect(result.name).toEqual(`Server ${status}`);
    }
  });

  it('should handle null/undefined optional fields correctly', async () => {
    const inputWithNulls: CreateHardwareAssetInput = {
      name: 'Server with nulls',
      type: 'server',
      status: 'active',
      model: null,
      manufacturer: null,
      serial_number: null,
      location: null,
      notes: null
    };

    const result = await createHardwareAsset(inputWithNulls);

    expect(result.name).toEqual('Server with nulls');
    expect(result.model).toBeNull();
    expect(result.manufacturer).toBeNull();
    expect(result.serial_number).toBeNull();
    expect(result.location).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should create multiple hardware assets with unique IDs', async () => {
    const result1 = await createHardwareAsset({ ...testInput, name: 'Server 1' });
    const result2 = await createHardwareAsset({ ...testInput, name: 'Server 2' });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Server 1');
    expect(result2.name).toEqual('Server 2');

    // Verify both exist in database
    const allAssets = await db.select().from(hardwareAssetsTable).execute();
    expect(allAssets).toHaveLength(2);
  });
});
