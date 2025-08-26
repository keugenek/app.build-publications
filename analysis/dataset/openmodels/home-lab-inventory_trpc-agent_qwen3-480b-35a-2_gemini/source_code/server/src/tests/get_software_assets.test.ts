import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type CreateSoftwareAssetInput } from '../schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';

// Test data
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  description: 'A server for testing'
};

const testSoftwareInputs: CreateSoftwareAssetInput[] = [
  {
    name: 'Test VM 1',
    type: 'VM',
    description: 'A VM for testing',
    host_id: 0 // Will be updated after creating hardware asset
  },
  {
    name: 'Test Container 1',
    type: 'container',
    description: 'A container for testing',
    host_id: 0 // Will be updated after creating hardware asset
  }
];

describe('getSoftwareAssets', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first (required for foreign key constraint)
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareInput)
      .returning()
      .execute();
    
    const hardwareId = hardwareResult[0].id;
    
    // Update host_id in test software inputs
    testSoftwareInputs[0].host_id = hardwareId;
    testSoftwareInputs[1].host_id = hardwareId;
    
    // Create software assets
    await db.insert(softwareAssetsTable)
      .values(testSoftwareInputs)
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all software assets', async () => {
    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    // Check first software asset
    expect(result[0]).toEqual({
      id: expect.any(Number),
      name: 'Test VM 1',
      type: 'VM',
      description: 'A VM for testing',
      host_id: expect.any(Number),
      created_at: expect.any(Date)
    });
    
    // Check second software asset
    expect(result[1]).toEqual({
      id: expect.any(Number),
      name: 'Test Container 1',
      type: 'container',
      description: 'A container for testing',
      host_id: expect.any(Number),
      created_at: expect.any(Date)
    });
  });

  it('should return empty array when no software assets exist', async () => {
    // Clear the software assets table
    await db.delete(softwareAssetsTable).execute();
    
    const result = await getSoftwareAssets();
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle software assets with null descriptions', async () => {
    // Create a software asset with null description
    const softwareWithNullDesc: typeof testSoftwareInputs[0] = {
      name: 'Test VM with null desc',
      type: 'VM',
      description: null,
      host_id: testSoftwareInputs[0].host_id
    };
    
    await db.insert(softwareAssetsTable)
      .values(softwareWithNullDesc)
      .execute();
    
    const result = await getSoftwareAssets();
    
    expect(result).toHaveLength(3);
    
    const assetWithNullDesc = result.find(asset => asset.name === 'Test VM with null desc');
    expect(assetWithNullDesc).toBeDefined();
    expect(assetWithNullDesc?.description).toBeNull();
  });
});
