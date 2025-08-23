import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateHardwareAssetInput = {
  name: 'Test Laptop',
  type: 'Laptop',
  model: 'ThinkPad X1',
  serialNumber: 'X1-123456',
  location: 'Office 101'
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Laptop');
    expect(result.type).toEqual(testInput.type);
    expect(result.model).toEqual(testInput.model);
    expect(result.serialNumber).toEqual(testInput.serialNumber);
    expect(result.location).toEqual(testInput.location);
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
    expect(hardwareAssets[0].name).toEqual('Test Laptop');
    expect(hardwareAssets[0].type).toEqual(testInput.type);
    expect(hardwareAssets[0].model).toEqual(testInput.model);
    expect(hardwareAssets[0].serialNumber).toEqual(testInput.serialNumber);
    expect(hardwareAssets[0].location).toEqual(testInput.location);
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
  });
});
