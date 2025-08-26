import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { getSoftwareAsset } from '../handlers/get_software_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a software asset
const testInput: CreateSoftwareAssetInput = {
  name: 'Test Software',
  type: 'Application',
  operatingSystem: 'Windows 11',
  host: 'Server01'
};

describe('getSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch an existing software asset by ID', async () => {
    // First create a software asset in the database
    const createdResult = await db.insert(softwareAssetsTable)
      .values({
        name: testInput.name,
        type: testInput.type,
        operatingSystem: testInput.operatingSystem,
        host: testInput.host
      })
      .returning()
      .execute();
    
    const createdAsset = createdResult[0];
    const assetId = createdAsset.id;

    // Now fetch it using our handler
    const result = await getSoftwareAsset(assetId);

    // Validate the fetched data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(assetId);
    expect(result!.name).toEqual(testInput.name);
    expect(result!.type).toEqual(testInput.type);
    expect(result!.operatingSystem).toEqual(testInput.operatingSystem);
    expect(result!.host).toEqual(testInput.host);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for a non-existent software asset', async () => {
    const result = await getSoftwareAsset(99999);
    expect(result).toBeNull();
  });

  it('should return the correct software asset when multiple exist', async () => {
    // Create two software assets
    const createdResult1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Software 1',
        type: 'Application',
        operatingSystem: 'Windows 10',
        host: 'Server01'
      })
      .returning()
      .execute();
    
    const createdResult2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Software 2',
        type: 'Service',
        operatingSystem: 'Linux',
        host: 'Server02'
      })
      .returning()
      .execute();

    const assetId1 = createdResult1[0].id;
    const assetId2 = createdResult2[0].id;

    // Fetch the second asset
    const result = await getSoftwareAsset(assetId2);

    // Validate it's the correct one
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(assetId2);
    expect(result!.name).toEqual('Software 2');
    expect(result!.type).toEqual('Service');
    expect(result!.operatingSystem).toEqual('Linux');
    expect(result!.host).toEqual('Server02');
  });
});
