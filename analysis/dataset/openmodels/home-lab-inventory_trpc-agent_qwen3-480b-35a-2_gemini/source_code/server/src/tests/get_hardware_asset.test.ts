import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { getHardwareAsset } from '../handlers/get_hardware_asset';
import { eq } from 'drizzle-orm';

describe('getHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch an existing hardware asset by ID', async () => {
    // First create a test hardware asset
    const createdAssetResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server for unit testing'
      })
      .returning()
      .execute();
    
    const createdAsset = createdAssetResult[0];
    
    // Now fetch it using our handler
    const fetchedAsset = await getHardwareAsset(createdAsset.id);
    
    expect(fetchedAsset).not.toBeNull();
    expect(fetchedAsset).toEqual({
      id: createdAsset.id,
      name: 'Test Server',
      type: 'server',
      description: 'A test server for unit testing',
      created_at: createdAsset.created_at
    });
    expect(fetchedAsset?.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent hardware asset', async () => {
    const result = await getHardwareAsset(99999);
    expect(result).toBeNull();
  });

  it('should handle hardware asset with null description', async () => {
    // Create a hardware asset with null description
    const createdAssetResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Switch Node 1',
        type: 'switch',
        description: null
      })
      .returning()
      .execute();
    
    const createdAsset = createdAssetResult[0];
    
    const fetchedAsset = await getHardwareAsset(createdAsset.id);
    
    expect(fetchedAsset).not.toBeNull();
    expect(fetchedAsset).toEqual({
      id: createdAsset.id,
      name: 'Switch Node 1',
      type: 'switch',
      description: null,
      created_at: createdAsset.created_at
    });
  });

  it('should correctly fetch different hardware asset types', async () => {
    // Create a server
    const serverResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Web Server 1',
        type: 'server',
        description: 'Primary web server'
      })
      .returning()
      .execute();
    
    // Create a switch
    const switchResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Core Switch',
        type: 'switch',
        description: 'Main network switch'
      })
      .returning()
      .execute();
    
    const serverAsset = await getHardwareAsset(serverResult[0].id);
    const switchAsset = await getHardwareAsset(switchResult[0].id);
    
    expect(serverAsset).toEqual({
      id: serverResult[0].id,
      name: 'Web Server 1',
      type: 'server',
      description: 'Primary web server',
      created_at: serverResult[0].created_at
    });
    
    expect(switchAsset).toEqual({
      id: switchResult[0].id,
      name: 'Core Switch',
      type: 'switch',
      description: 'Main network switch',
      created_at: switchResult[0].created_at
    });
  });
});
