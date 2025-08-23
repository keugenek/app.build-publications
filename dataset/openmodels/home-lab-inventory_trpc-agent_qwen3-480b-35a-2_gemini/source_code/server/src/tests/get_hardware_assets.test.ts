import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

describe('getHardwareAssets', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(hardwareAssetsTable).values([
      {
        name: 'Server 1',
        type: 'server',
        description: 'Main application server'
      },
      {
        name: 'Switch 1',
        type: 'switch',
        description: 'Network switch'
      },
      {
        name: 'Server 2',
        type: 'server',
        description: null
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should return all hardware assets', async () => {
    const results = await getHardwareAssets();

    expect(results).toHaveLength(3);
    
    // Check first asset
    const server1 = results.find(asset => asset.name === 'Server 1');
    expect(server1).toBeDefined();
    expect(server1!.type).toEqual('server');
    expect(server1!.description).toEqual('Main application server');
    expect(server1!.id).toBeDefined();
    expect(server1!.created_at).toBeInstanceOf(Date);
    
    // Check second asset
    const switch1 = results.find(asset => asset.name === 'Switch 1');
    expect(switch1).toBeDefined();
    expect(switch1!.type).toEqual('switch');
    expect(switch1!.description).toEqual('Network switch');
    expect(switch1!.id).toBeDefined();
    expect(switch1!.created_at).toBeInstanceOf(Date);
    
    // Check third asset with null description
    const server2 = results.find(asset => asset.name === 'Server 2');
    expect(server2).toBeDefined();
    expect(server2!.type).toEqual('server');
    expect(server2!.description).toBeNull();
    expect(server2!.id).toBeDefined();
    expect(server2!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no hardware assets exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const results = await getHardwareAssets();
    expect(results).toHaveLength(0);
  });
});
