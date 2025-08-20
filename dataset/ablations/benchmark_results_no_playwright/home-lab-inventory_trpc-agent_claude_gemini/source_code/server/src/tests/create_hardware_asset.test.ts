import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'Server',
  manufacturer: 'Dell',
  model: 'PowerEdge R750',
  description: 'A test server for unit testing'
};

// Test input with null description
const testInputNullDescription: CreateHardwareAssetInput = {
  name: 'Test Switch',
  type: 'Switch',
  manufacturer: 'Cisco',
  model: 'Catalyst 9300',
  description: null
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset with all fields', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Server');
    expect(result.type).toEqual('Server');
    expect(result.manufacturer).toEqual('Dell');
    expect(result.model).toEqual('PowerEdge R750');
    expect(result.description).toEqual('A test server for unit testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a hardware asset with null description', async () => {
    const result = await createHardwareAsset(testInputNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Switch');
    expect(result.type).toEqual('Switch');
    expect(result.manufacturer).toEqual('Cisco');
    expect(result.model).toEqual('Catalyst 9300');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
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
    expect(hardwareAssets[0].type).toEqual('Server');
    expect(hardwareAssets[0].manufacturer).toEqual('Dell');
    expect(hardwareAssets[0].model).toEqual('PowerEdge R750');
    expect(hardwareAssets[0].description).toEqual('A test server for unit testing');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(hardwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple hardware assets with different types', async () => {
    const serverInput: CreateHardwareAssetInput = {
      name: 'Web Server',
      type: 'Server',
      manufacturer: 'HP',
      model: 'ProLiant DL380',
      description: 'Web application server'
    };

    const routerInput: CreateHardwareAssetInput = {
      name: 'Core Router',
      type: 'Router',
      manufacturer: 'Cisco',
      model: 'ISR 4000',
      description: 'Main network router'
    };

    const storageInput: CreateHardwareAssetInput = {
      name: 'Storage Array',
      type: 'Storage',
      manufacturer: 'NetApp',
      model: 'FAS2720',
      description: null
    };

    // Create all assets
    const server = await createHardwareAsset(serverInput);
    const router = await createHardwareAsset(routerInput);
    const storage = await createHardwareAsset(storageInput);

    // Verify all have different IDs
    expect(server.id).not.toEqual(router.id);
    expect(server.id).not.toEqual(storage.id);
    expect(router.id).not.toEqual(storage.id);

    // Verify all are in database
    const allAssets = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    expect(allAssets).toHaveLength(3);
    
    // Verify each asset type is represented
    const types = allAssets.map(asset => asset.type);
    expect(types).toContain('Server');
    expect(types).toContain('Router');
    expect(types).toContain('Storage');
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreate = new Date();
    
    const result = await createHardwareAsset(testInput);
    
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);

    // For new records, created_at and updated_at should be very close
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});
