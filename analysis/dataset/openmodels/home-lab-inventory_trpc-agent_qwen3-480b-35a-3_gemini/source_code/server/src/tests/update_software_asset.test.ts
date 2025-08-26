import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type UpdateSoftwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a software asset
const createInput: CreateSoftwareAssetInput = {
  name: 'Test Software',
  type: 'Application',
  operatingSystem: 'Windows 11',
  host: 'test-host-01'
};

// Test input for updating a software asset
const updateInput: UpdateSoftwareAssetInput = {
  id: 1,
  name: 'Updated Software',
  type: 'System Utility',
  operatingSystem: 'Windows 10',
  host: 'updated-host-01'
};

describe('updateSoftwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test software asset
    await db.insert(softwareAssetsTable)
      .values(createInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a software asset with all fields', async () => {
    const result = await updateSoftwareAsset(updateInput);

    // Basic field validation
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toEqual('Updated Software');
      expect(result.type).toEqual('System Utility');
      expect(result.operatingSystem).toEqual('Windows 10');
      expect(result.host).toEqual('updated-host-01');
      expect(result.id).toEqual(1);
      expect(result.created_at).toBeInstanceOf(Date);
    }
  });

  it('should update partial fields of a software asset', async () => {
    const partialUpdate: UpdateSoftwareAssetInput = {
      id: 1,
      name: 'Partially Updated Software',
      host: 'partial-host-01'
    };

    const result = await updateSoftwareAsset(partialUpdate);

    // Basic field validation
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toEqual('Partially Updated Software');
      expect(result.host).toEqual('partial-host-01');
      // Other fields should remain unchanged
      expect(result.type).toEqual('Application');
      expect(result.operatingSystem).toEqual('Windows 11');
      expect(result.id).toEqual(1);
    }
  });

  it('should save updated software asset to database', async () => {
    await updateSoftwareAsset(updateInput);

    // Query using proper drizzle syntax
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, 1))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Updated Software');
    expect(softwareAssets[0].type).toEqual('System Utility');
    expect(softwareAssets[0].operatingSystem).toEqual('Windows 10');
    expect(softwareAssets[0].host).toEqual('updated-host-01');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null when updating non-existent software asset', async () => {
    const nonExistentUpdate: UpdateSoftwareAssetInput = {
      id: 999,
      name: 'Non-existent Software'
    };

    const result = await updateSoftwareAsset(nonExistentUpdate);
    expect(result).toBeNull();
  });
});
