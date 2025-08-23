import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateSoftwareAssetInput = {
  name: 'Test Software',
  type: 'Application',
  operatingSystem: 'Windows 11',
  host: 'Test Host'
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Software');
    expect(result.type).toEqual('Application');
    expect(result.operatingSystem).toEqual('Windows 11');
    expect(result.host).toEqual('Test Host');
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
    expect(softwareAssets[0].name).toEqual('Test Software');
    expect(softwareAssets[0].type).toEqual('Application');
    expect(softwareAssets[0].operatingSystem).toEqual('Windows 11');
    expect(softwareAssets[0].host).toEqual('Test Host');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
  });
});
