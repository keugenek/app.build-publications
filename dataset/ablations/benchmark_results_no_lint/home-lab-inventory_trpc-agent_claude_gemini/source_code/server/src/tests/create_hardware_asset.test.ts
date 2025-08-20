import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateHardwareAssetInput = {
  name: 'Dell OptiPlex 7090',
  type: 'Desktop Computer',
  make: 'Dell',
  model: 'OptiPlex 7090',
  serial_number: 'DL123456789',
  description: 'High-performance desktop for development work'
};

// Test input with minimal required fields
const minimalTestInput: CreateHardwareAssetInput = {
  name: 'Basic Server',
  type: 'Server',
  make: 'HP',
  model: 'ProLiant',
  serial_number: null,
  description: null
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset with all fields', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Dell OptiPlex 7090');
    expect(result.type).toEqual('Desktop Computer');
    expect(result.make).toEqual('Dell');
    expect(result.model).toEqual('OptiPlex 7090');
    expect(result.serial_number).toEqual('DL123456789');
    expect(result.description).toEqual('High-performance desktop for development work');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a hardware asset with minimal fields', async () => {
    const result = await createHardwareAsset(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Basic Server');
    expect(result.type).toEqual('Server');
    expect(result.make).toEqual('HP');
    expect(result.model).toEqual('ProLiant');
    expect(result.serial_number).toBeNull();
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
    expect(hardwareAssets[0].name).toEqual('Dell OptiPlex 7090');
    expect(hardwareAssets[0].type).toEqual('Desktop Computer');
    expect(hardwareAssets[0].make).toEqual('Dell');
    expect(hardwareAssets[0].model).toEqual('OptiPlex 7090');
    expect(hardwareAssets[0].serial_number).toEqual('DL123456789');
    expect(hardwareAssets[0].description).toEqual('High-performance desktop for development work');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(hardwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null serial_number and description correctly', async () => {
    const result = await createHardwareAsset(minimalTestInput);

    // Verify in database
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    expect(hardwareAssets[0].serial_number).toBeNull();
    expect(hardwareAssets[0].description).toBeNull();
  });

  it('should create multiple hardware assets successfully', async () => {
    const asset1 = await createHardwareAsset(testInput);
    const asset2 = await createHardwareAsset({
      ...minimalTestInput,
      name: 'Another Asset'
    });

    // Verify both assets have unique IDs
    expect(asset1.id).not.toEqual(asset2.id);

    // Verify both are in database
    const allAssets = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    expect(allAssets).toHaveLength(2);
    
    const names = allAssets.map(asset => asset.name).sort();
    expect(names).toEqual(['Another Asset', 'Dell OptiPlex 7090']);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createHardwareAsset(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
