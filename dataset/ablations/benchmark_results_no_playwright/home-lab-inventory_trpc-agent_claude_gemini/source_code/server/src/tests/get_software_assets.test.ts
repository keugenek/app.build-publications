import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';

describe('getSoftwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no software assets exist', async () => {
    const result = await getSoftwareAssets();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all software assets', async () => {
    // Create hardware asset first for foreign key reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740'
      })
      .returning()
      .execute();
    
    const hardwareAssetId = hardwareResult[0].id;

    // Insert test software assets
    await db.insert(softwareAssetsTable)
      .values([
        {
          name: 'Web Server VM',
          type: 'VM',
          description: 'Virtual machine for web server',
          hardware_asset_id: hardwareAssetId
        },
        {
          name: 'Database Container',
          type: 'Container',
          description: 'PostgreSQL database container',
          hardware_asset_id: null
        },
        {
          name: 'Monitoring Service',
          type: 'Service',
          description: null,
          hardware_asset_id: hardwareAssetId
        }
      ])
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Web Server VM');
    expect(result[0].type).toEqual('VM');
    expect(result[0].description).toEqual('Virtual machine for web server');
    expect(result[0].hardware_asset_id).toEqual(hardwareAssetId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Database Container');
    expect(result[1].type).toEqual('Container');
    expect(result[1].description).toEqual('PostgreSQL database container');
    expect(result[1].hardware_asset_id).toBeNull();

    expect(result[2].name).toEqual('Monitoring Service');
    expect(result[2].type).toEqual('Service');
    expect(result[2].description).toBeNull();
    expect(result[2].hardware_asset_id).toEqual(hardwareAssetId);
  });

  it('should handle software assets with various data types correctly', async () => {
    // Insert software asset with minimal required fields
    await db.insert(softwareAssetsTable)
      .values({
        name: 'Simple Service',
        type: 'Service'
      })
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Simple Service');
    expect(result[0].type).toEqual('Service');
    expect(result[0].description).toBeNull();
    expect(result[0].hardware_asset_id).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return software assets ordered by creation time', async () => {
    // Insert multiple software assets with slight delay to ensure different timestamps
    await db.insert(softwareAssetsTable)
      .values({
        name: 'First Service',
        type: 'Service'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(softwareAssetsTable)
      .values({
        name: 'Second Service',
        type: 'Service'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(softwareAssetsTable)
      .values({
        name: 'Third Service',
        type: 'Service'
      })
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(3);
    // Results should be in database insertion order (creation time ascending)
    expect(result[0].name).toEqual('First Service');
    expect(result[1].name).toEqual('Second Service');
    expect(result[2].name).toEqual('Third Service');
    
    // Verify timestamps are in ascending order
    expect(result[0].created_at <= result[1].created_at).toBe(true);
    expect(result[1].created_at <= result[2].created_at).toBe(true);
  });
});
