import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM',
  host_id: 1,
  operating_system: 'Ubuntu 20.04',
  description: 'A virtual machine for testing'
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test VM');
    expect(result.type).toEqual('VM');
    expect(result.host_id).toEqual(1);
    expect(result.operating_system).toEqual('Ubuntu 20.04');
    expect(result.description).toEqual('A virtual machine for testing');
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
    expect(softwareAssets[0].host_id).toEqual(1);
    expect(softwareAssets[0].operating_system).toEqual('Ubuntu 20.04');
    expect(softwareAssets[0].description).toEqual('A virtual machine for testing');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle software asset with null description', async () => {
    const inputWithNullDescription: CreateSoftwareAssetInput = {
      name: 'Test Container',
      type: 'Container',
      host_id: 2,
      operating_system: 'Alpine Linux',
      description: null
    };

    const result = await createSoftwareAsset(inputWithNullDescription);

    expect(result.name).toEqual('Test Container');
    expect(result.type).toEqual('Container');
    expect(result.host_id).toEqual(2);
    expect(result.operating_system).toEqual('Alpine Linux');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].description).toBeNull();
  });
});
