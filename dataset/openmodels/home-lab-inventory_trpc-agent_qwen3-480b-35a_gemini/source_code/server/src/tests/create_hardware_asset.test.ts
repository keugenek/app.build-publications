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
  make: 'Dell',
  model: 'PowerEdge R740',
  serial_number: 'ABC123XYZ',
  description: 'Test server for development'
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Server');
    expect(result.type).toEqual('Server');
    expect(result.make).toEqual('Dell');
    expect(result.model).toEqual('PowerEdge R740');
    expect(result.serial_number).toEqual('ABC123XYZ');
    expect(result.description).toEqual('Test server for development');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
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
    expect(hardwareAssets[0].make).toEqual('Dell');
    expect(hardwareAssets[0].model).toEqual('PowerEdge R740');
    expect(hardwareAssets[0].serial_number).toEqual('ABC123XYZ');
    expect(hardwareAssets[0].description).toEqual('Test server for development');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreateHardwareAssetInput = {
      name: 'Test Switch',
      type: 'Switch',
      make: 'Cisco',
      model: 'Catalyst 9000',
      serial_number: 'XYZ789ABC',
      description: null
    };

    const result = await createHardwareAsset(inputWithNullDescription);
    
    expect(result.description).toBeNull();
    
    // Verify in database
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    expect(hardwareAssets[0].description).toBeNull();
  });
});
