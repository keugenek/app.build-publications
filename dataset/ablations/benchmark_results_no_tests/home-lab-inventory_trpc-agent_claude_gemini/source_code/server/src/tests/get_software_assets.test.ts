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
  });

  it('should return all software assets', async () => {
    // Create a hardware asset first for foreign key reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();
    
    const hardwareId = hardwareResult[0].id;

    // Insert test software assets with different configurations
    await db.insert(softwareAssetsTable)
      .values([
        {
          name: 'Web Server VM',
          type: 'virtual_machine',
          status: 'running',
          host_hardware_id: hardwareId,
          operating_system: 'Ubuntu 22.04',
          version: '1.0.0',
          notes: 'Production web server'
        },
        {
          name: 'Database Container',
          type: 'container',
          status: 'running',
          host_hardware_id: null,
          operating_system: 'Docker',
          version: '2.1.0',
          notes: 'PostgreSQL container'
        },
        {
          name: 'Monitoring Service',
          type: 'service',
          status: 'stopped',
          host_hardware_id: hardwareId,
          operating_system: null,
          version: null,
          notes: null
        }
      ])
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(3);
    
    // Verify first software asset
    const webServer = result.find(asset => asset.name === 'Web Server VM');
    expect(webServer).toBeDefined();
    expect(webServer!.type).toEqual('virtual_machine');
    expect(webServer!.status).toEqual('running');
    expect(webServer!.host_hardware_id).toEqual(hardwareId);
    expect(webServer!.operating_system).toEqual('Ubuntu 22.04');
    expect(webServer!.version).toEqual('1.0.0');
    expect(webServer!.notes).toEqual('Production web server');
    expect(webServer!.id).toBeDefined();
    expect(webServer!.created_at).toBeInstanceOf(Date);
    expect(webServer!.updated_at).toBeInstanceOf(Date);

    // Verify second software asset
    const dbContainer = result.find(asset => asset.name === 'Database Container');
    expect(dbContainer).toBeDefined();
    expect(dbContainer!.type).toEqual('container');
    expect(dbContainer!.status).toEqual('running');
    expect(dbContainer!.host_hardware_id).toBeNull();
    expect(dbContainer!.operating_system).toEqual('Docker');
    expect(dbContainer!.version).toEqual('2.1.0');
    expect(dbContainer!.notes).toEqual('PostgreSQL container');

    // Verify third software asset with null values
    const monitoringService = result.find(asset => asset.name === 'Monitoring Service');
    expect(monitoringService).toBeDefined();
    expect(monitoringService!.type).toEqual('service');
    expect(monitoringService!.status).toEqual('stopped');
    expect(monitoringService!.host_hardware_id).toEqual(hardwareId);
    expect(monitoringService!.operating_system).toBeNull();
    expect(monitoringService!.version).toBeNull();
    expect(monitoringService!.notes).toBeNull();
  });

  it('should return software assets with all possible types and statuses', async () => {
    // Insert software assets with all enum values
    await db.insert(softwareAssetsTable)
      .values([
        {
          name: 'Virtual Machine',
          type: 'virtual_machine',
          status: 'running'
        },
        {
          name: 'Container App',
          type: 'container',
          status: 'stopped'
        },
        {
          name: 'Background Service',
          type: 'service',
          status: 'paused'
        },
        {
          name: 'Mobile Application',
          type: 'application',
          status: 'error'
        },
        {
          name: 'Other Software',
          type: 'other',
          status: 'running'
        }
      ])
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(5);

    // Verify all types are represented
    const types = result.map(asset => asset.type);
    expect(types).toContain('virtual_machine');
    expect(types).toContain('container');
    expect(types).toContain('service');
    expect(types).toContain('application');
    expect(types).toContain('other');

    // Verify all statuses are represented
    const statuses = result.map(asset => asset.status);
    expect(statuses).toContain('running');
    expect(statuses).toContain('stopped');
    expect(statuses).toContain('paused');
    expect(statuses).toContain('error');
  });

  it('should return software assets ordered by creation time', async () => {
    // Insert multiple software assets
    const firstAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'First Software',
        type: 'application',
        status: 'running'
      })
      .returning()
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Second Software',
        type: 'service',
        status: 'stopped'
      })
      .returning()
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    // Find the assets in the result
    const firstFound = result.find(asset => asset.id === firstAsset[0].id);
    const secondFound = result.find(asset => asset.id === secondAsset[0].id);
    
    expect(firstFound).toBeDefined();
    expect(secondFound).toBeDefined();
    expect(firstFound!.created_at.getTime()).toBeLessThan(secondFound!.created_at.getTime());
  });
});
