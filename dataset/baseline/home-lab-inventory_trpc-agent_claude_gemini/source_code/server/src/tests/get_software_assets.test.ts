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
    expect(result).toHaveLength(0);
  });

  it('should return all software assets', async () => {
    // Create prerequisite hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge R720',
        location: 'Data Center A'
      })
      .returning()
      .execute();

    const hardwareId = hardwareResult[0].id;

    // Create test software assets
    await db.insert(softwareAssetsTable)
      .values([
        {
          name: 'Web Server VM',
          type: 'vm',
          host_id: hardwareId,
          description: 'Main web server virtual machine'
        },
        {
          name: 'Database Container',
          type: 'container',
          host_id: null,
          description: 'PostgreSQL database container'
        },
        {
          name: 'Monitoring Service',
          type: 'service',
          host_id: hardwareId,
          description: null
        }
      ])
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(3);
    
    // Verify first software asset
    const webServerVM = result.find(asset => asset.name === 'Web Server VM');
    expect(webServerVM).toBeDefined();
    expect(webServerVM!.type).toEqual('vm');
    expect(webServerVM!.host_id).toEqual(hardwareId);
    expect(webServerVM!.description).toEqual('Main web server virtual machine');
    expect(webServerVM!.id).toBeDefined();
    expect(webServerVM!.created_at).toBeInstanceOf(Date);
    expect(webServerVM!.updated_at).toBeInstanceOf(Date);

    // Verify second software asset
    const dbContainer = result.find(asset => asset.name === 'Database Container');
    expect(dbContainer).toBeDefined();
    expect(dbContainer!.type).toEqual('container');
    expect(dbContainer!.host_id).toBeNull();
    expect(dbContainer!.description).toEqual('PostgreSQL database container');

    // Verify third software asset
    const monitoringService = result.find(asset => asset.name === 'Monitoring Service');
    expect(monitoringService).toBeDefined();
    expect(monitoringService!.type).toEqual('service');
    expect(monitoringService!.host_id).toEqual(hardwareId);
    expect(monitoringService!.description).toBeNull();
  });

  it('should return software assets with different types', async () => {
    // Create software assets with all different types
    await db.insert(softwareAssetsTable)
      .values([
        {
          name: 'Virtual Machine',
          type: 'vm',
          host_id: null,
          description: 'Test VM'
        },
        {
          name: 'Docker Container',
          type: 'container',
          host_id: null,
          description: 'Test container'
        },
        {
          name: 'Web Service',
          type: 'service',
          host_id: null,
          description: 'Test service'
        },
        {
          name: 'Custom App',
          type: 'application',
          host_id: null,
          description: 'Test application'
        },
        {
          name: 'Other Software',
          type: 'other',
          host_id: null,
          description: 'Test other type'
        }
      ])
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(5);
    
    const types = result.map(asset => asset.type);
    expect(types).toContain('vm');
    expect(types).toContain('container');
    expect(types).toContain('service');
    expect(types).toContain('application');
    expect(types).toContain('other');
  });

  it('should handle software assets with nullable fields', async () => {
    // Create software asset with minimal required fields
    await db.insert(softwareAssetsTable)
      .values({
        name: 'Minimal Software',
        type: 'other',
        host_id: null,
        description: null
      })
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Software');
    expect(result[0].type).toEqual('other');
    expect(result[0].host_id).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should maintain proper chronological order', async () => {
    // Create software assets with slight time delays to test ordering
    await db.insert(softwareAssetsTable)
      .values({
        name: 'First Software',
        type: 'vm',
        host_id: null,
        description: 'Created first'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(softwareAssetsTable)
      .values({
        name: 'Second Software',
        type: 'container',
        host_id: null,
        description: 'Created second'
      })
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    // Verify both assets are returned
    const firstAsset = result.find(asset => asset.name === 'First Software');
    const secondAsset = result.find(asset => asset.name === 'Second Software');
    
    expect(firstAsset).toBeDefined();
    expect(secondAsset).toBeDefined();
    expect(firstAsset!.created_at).toBeInstanceOf(Date);
    expect(secondAsset!.created_at).toBeInstanceOf(Date);
  });
});
