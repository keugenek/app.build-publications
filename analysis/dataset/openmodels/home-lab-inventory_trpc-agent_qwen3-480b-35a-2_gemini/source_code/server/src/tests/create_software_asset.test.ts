import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM',
  description: 'A virtual machine for testing',
  host_id: 1
};

describe('createSoftwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first as it's required for the foreign key
    await db.insert(hardwareAssetsTable)
      .values({
        id: 1,
        name: 'Test Server',
        type: 'server',
        description: 'A test server'
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a software asset', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test VM');
    expect(result.type).toEqual('VM');
    expect(result.description).toEqual('A virtual machine for testing');
    expect(result.host_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save software asset to database', async () => {
    const result = await createSoftwareAsset(testInput);

    // Query using proper drizzle syntax
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Test VM');
    expect(softwareAssets[0].type).toEqual('VM');
    expect(softwareAssets[0].description).toEqual('A virtual machine for testing');
    expect(softwareAssets[0].host_id).toEqual(1);
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
  });
});
