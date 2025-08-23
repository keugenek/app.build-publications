import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  description: 'A server for testing purposes'
};

const testSwitchInput: CreateHardwareAssetInput = {
  name: 'Test Switch',
  type: 'switch',
  description: null
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset with server type', async () => {
    const result = await createHardwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Server');
    expect(result.type).toEqual('server');
    expect(result.description).toEqual('A server for testing purposes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a hardware asset with switch type and null description', async () => {
    const result = await createHardwareAsset(testSwitchInput);

    // Basic field validation
    expect(result.name).toEqual('Test Switch');
    expect(result.type).toEqual('switch');
    expect(result.description).toBeNull();
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
    expect(hardwareAssets[0].type).toEqual('server');
    expect(hardwareAssets[0].description).toEqual('A server for testing purposes');
    expect(hardwareAssets[0].created_at).toBeInstanceOf(Date);
  });
});
