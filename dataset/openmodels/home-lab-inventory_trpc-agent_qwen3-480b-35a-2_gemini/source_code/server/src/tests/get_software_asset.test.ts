import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { getSoftwareAsset } from '../handlers/get_software_asset';
import { eq } from 'drizzle-orm';

describe('getSoftwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first as it's required for software asset
    const hardwareResult = await db
      .insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server',
      })
      .returning()
      .execute();
    
    const hardwareId = hardwareResult[0].id;
    
    // Create a software asset for testing
    await db
      .insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'A test virtual machine',
        host_id: hardwareId,
      })
      .returning()
      .execute();
  });

  afterEach(resetDB);

  it('should fetch an existing software asset by ID', async () => {
    // Get the software asset ID from the database
    const existingAsset = await db
      .select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.name, 'Test VM'))
      .execute();
    
    expect(existingAsset).toHaveLength(1);
    const assetId = existingAsset[0].id;

    // Test the handler
    const result = await getSoftwareAsset(assetId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: assetId,
      name: 'Test VM',
      type: 'VM',
      description: 'A test virtual machine',
      host_id: existingAsset[0].host_id,
      created_at: expect.any(Date),
    });
  });

  it('should return null for a non-existent software asset ID', async () => {
    const result = await getSoftwareAsset(99999);
    expect(result).toBeNull();
  });

  it('should handle software asset with null description', async () => {
    // Create a hardware asset
    const hardwareResult = await db
      .insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 2',
        type: 'server',
        description: 'Another test server',
      })
      .returning()
      .execute();
    
    const hardwareId = hardwareResult[0].id;
    
    // Create a software asset with null description
    const softwareResult = await db
      .insert(softwareAssetsTable)
      .values({
        name: 'Test Container',
        type: 'container',
        description: null,
        host_id: hardwareId,
      })
      .returning()
      .execute();
    
    const assetId = softwareResult[0].id;
    
    // Test the handler
    const result = await getSoftwareAsset(assetId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: assetId,
      name: 'Test Container',
      type: 'container',
      description: null,
      host_id: hardwareId,
      created_at: expect.any(Date),
    });
  });

  it('should correctly fetch software asset with container type', async () => {
    // Create a hardware asset
    const hardwareResult = await db
      .insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 3',
        type: 'server',
        description: 'Yet another test server',
      })
      .returning()
      .execute();
    
    const hardwareId = hardwareResult[0].id;
    
    // Create a container software asset
    const softwareResult = await db
      .insert(softwareAssetsTable)
      .values({
        name: 'Test Container App',
        type: 'container',
        description: 'A containerized application',
        host_id: hardwareId,
      })
      .returning()
      .execute();
    
    const assetId = softwareResult[0].id;
    
    // Test the handler
    const result = await getSoftwareAsset(assetId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: assetId,
      name: 'Test Container App',
      type: 'container',
      description: 'A containerized application',
      host_id: hardwareId,
      created_at: expect.any(Date),
    });
  });
});
